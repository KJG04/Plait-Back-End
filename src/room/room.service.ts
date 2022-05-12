import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PersistedQueryNotFoundError } from 'apollo-server-errors';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import JoinRoomInput from './interface/JoinRoomInput.interface';
import { User } from './entities/user.entity';
import { nanoid } from 'nanoid';
import { JwtService } from '@nestjs/jwt';
import JwtPayload from './interface/JwtPayload.interface';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async getActiveUsers(): Promise<number> {
    const rooms = await this.roomRepository.find();

    if (rooms.length <= 0) {
      return 0;
    }

    return rooms
      .map((value) => value.users.length)
      .reduce((prev, curr) => prev + curr);
  }

  async joinRoom(room: JoinRoomInput): Promise<string> {
    const { name, roomCode } = room;
    //코드를 통해 방을 찾는다
    const findedRoom = await this.roomRepository.findOne({
      where: { code: roomCode },
      relations: ['users'],
    });

    //찾은 방이 없으면 not found 오류
    if (!findedRoom) {
      throw new PersistedQueryNotFoundError();
    }

    //유저 생성
    const user = User.create(name, findedRoom);
    await this.userRepository.save(user);

    const payload: JwtPayload = {
      roomCode: findedRoom.code,
      userUuid: user.uuid,
    };

    //토큰 생성
    const token = this.jwtService.sign(payload);

    return token;
  }

  async createRoom(name: string): Promise<string[]> {
    const room = Room.create(); //방을 만듬
    const findedRoom = await this.roomRepository.findOneBy({ code: room.code });

    if (findedRoom) {
      //있는 방 중 중복된 코드가 있으면 다시 랜덤으로 가져옴
      room.code = nanoid(6);
    }

    //생성한 방 저장
    const createdRoom = await this.roomRepository.save(room);

    //생성한 방에 유저 생성
    const user = User.create(name, createdRoom);
    await this.userRepository.save(user);

    const payload: JwtPayload = {
      roomCode: createdRoom.code,
      userUuid: user.uuid,
    };

    //토큰 발급
    const token = this.jwtService.sign(payload);

    return [createdRoom.code, token];
  }

  async leaveRoom(token: string) {
    const { userUuid, roomCode } = this.jwtService.decode(token) as JwtPayload;

    //유저 제거
    await this.userRepository.delete({ uuid: userUuid });

    //나간 방 가져오기
    const room = await this.roomRepository.findOne({
      where: { code: roomCode },
      relations: ['users'],
    });

    //방에 유저가 없으면 삭제
    if (room.users.length <= 0) {
      await this.roomRepository.remove(room);
    }
  }
}
