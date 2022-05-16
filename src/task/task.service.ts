import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from 'src/room/entities/room.entity';
import { LessThan, Repository } from 'typeorm';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async removeUnusedRoom() {
    const beforeTwoDay = new Date();
    beforeTwoDay.setDate(beforeTwoDay.getDate() - 2);

    const rooms = await this.roomRepository.findBy({
      createdAt: LessThan(beforeTwoDay),
    });

    await this.roomRepository.remove(rooms);
  }
}
