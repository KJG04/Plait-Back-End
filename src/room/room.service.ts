import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PersistedQueryNotFoundError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-errors';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import JoinRoomInput from './interface/JoinRoomInput.interface';
import { User } from './entities/user.entity';
import { nanoid } from 'nanoid';
import { JwtService } from '@nestjs/jwt';
import JwtPayload from './interface/JwtPayload.interface';
import { Content, ContentType } from './entities/content.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
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

  async createRoom(name: string): Promise<[Room, string]> {
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

    return [createdRoom, token];
  }

  async leaveRoom(token: string) {
    if (!token) {
      return;
    }
    const { userUuid, roomCode } = this.jwtService.decode(token) as JwtPayload;

    //유저 제거
    this.userRepository.update({ uuid: userUuid }, { isDeleted: true });

    let room: Room;
    try {
      //나간 방 가져오기
      room = await this.roomRepository.findOneOrFail({
        where: { code: roomCode },
        relations: ['users'],
      });
    } catch (error) {
      throw new PersistedQueryNotFoundError();
    }

    //방에 유저가 없으면 삭제
    if (
      room.users.length <= 0 ||
      room.users.every((value) => value.isDeleted)
    ) {
      await this.roomRepository.remove(room);
    }
  }

  async checkAuthenfication(
    token: string,
    roomCode: string,
  ): Promise<JwtPayload> {
    if (!token) {
      throw new AuthenticationError('인증되지 않은 사용자입니다.');
    }

    const payload = this.jwtService.decode(token) as JwtPayload;

    const { roomCode: payloadRoomCode, userUuid } = payload;

    if (payloadRoomCode !== roomCode) {
      throw new ForbiddenError('요청한 방에 참여하지 않은 유저입니다.');
    }

    const user = await this.userRepository.findOneByOrFail({ uuid: userUuid });

    if (user.isDeleted) {
      throw new AuthenticationError('삭제 된 사용자입니다.');
    }

    return payload;
  }

  async getIsContentPlaying(roomCode: string): Promise<boolean> {
    try {
      const room = await this.roomRepository.findOneByOrFail({
        code: roomCode,
      });

      return room.isPlaying;
    } catch (error) {
      throw new PersistedQueryNotFoundError();
    }
  }

  async getRoomCodeByToken(token: string) {
    const payload = this.jwtService.decode(token) as JwtPayload;
    const { roomCode: payloadRoomCode } = payload;
    try {
      return await this.roomRepository.findOneOrFail({
        where: { code: payloadRoomCode },
      });
    } catch (error) {
      throw new PersistedQueryNotFoundError();
    }
  }

  async modifyIsContentPlaying(
    roomCode: string,
    condition: boolean,
  ): Promise<boolean> {
    let room: Room;
    try {
      room = await this.roomRepository.findOneByOrFail({
        code: roomCode,
      });
    } catch (error) {
      throw new PersistedQueryNotFoundError();
    }

    room.isPlaying = condition;

    await this.roomRepository.save(room);

    return room.isPlaying;
  }

  async getContents(roomCode: string): Promise<Content[]> {
    try {
      const room = await this.roomRepository.findOneOrFail({
        where: { code: roomCode },
        relations: ['contents'],
      });

      return room.contents;
    } catch (error) {
      throw new PersistedQueryNotFoundError();
    }
  }

  async pushContent(
    roomCode: string,
    userUuid: string,
    contentId: string,
    type: ContentType,
  ): Promise<Content[]> {
    let room: Room;

    try {
      room = await this.roomRepository.findOneOrFail({
        where: { code: roomCode },
        relations: ['contents'],
      });
    } catch (error) {
      throw new PersistedQueryNotFoundError();
    }

    const newContent = Content.create(contentId, type);
    newContent.room = room;

    let user: User;
    try {
      user = await this.userRepository.findOneByOrFail({ uuid: userUuid });
    } catch (error) {
      throw new PersistedQueryNotFoundError();
    }
    newContent.user = user;

    await this.contentRepository.save(newContent);

    return await this.contentRepository.find({
      where: { room: { id: room.id } },
      relations: ['user', 'room'],
    });
  }

  async checkIsRoomExist(roomCode: string) {
    try {
      await this.roomRepository.findOneByOrFail({ code: roomCode });
    } catch (error) {
      throw new PersistedQueryNotFoundError();
    }
  }

  async removeContent(roomCode: string, uuid: string): Promise<Content[]> {
    await this.contentRepository.delete({ uuid });

    let room: Room;
    try {
      room = await this.roomRepository.findOneOrFail({
        where: { code: roomCode },
        relations: ['contents'],
      });
    } catch (error) {
      throw new PersistedQueryNotFoundError();
    }

    return room.contents;
  }
}
