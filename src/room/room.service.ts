import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PersistedQueryNotFoundError } from 'apollo-server-errors';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import JoinRoomInput from './input/JoinRoomInput.interface';
import { User } from './entities/user.entity';
import { nanoid } from 'nanoid';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async joinRoom(room: JoinRoomInput): Promise<boolean> {
    const { name, roomCode } = room;
    const findedRoom = await this.roomRepository.findOne({
      where: { code: roomCode },
      relations: ['users'],
    });

    if (!findedRoom) {
      throw new PersistedQueryNotFoundError();
    }

    const user = User.create(name, findedRoom);
    await this.userRepository.save(user);

    return true;
  }

  async createRoom(name: string): Promise<string> {
    const room = Room.create();

    const findedRoom = await this.roomRepository.findOneBy({ code: room.code });

    if (findedRoom) {
      room.code = nanoid(6);
    }

    const user = User.create(name, room);

    await this.roomRepository.save({ code: '', isPlaying: false, playTime: 0 });
    await this.userRepository.save(user);

    return room.code;
  }
}
