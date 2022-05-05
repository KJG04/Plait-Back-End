import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
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
}
