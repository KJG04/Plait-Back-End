import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from 'src/room/entities/room.entity';
import { User } from 'src/room/entities/user.entity';
import { LessThan, Repository } from 'typeorm';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  @Cron(CronExpression.EVERY_MINUTE)
  async dislisteningUser() {
    const beforeOneMinute = new Date();
    beforeOneMinute.setMinutes(beforeOneMinute.getMinutes() - 1);

    const users = await this.userRepository.find({
      where: { lastListeningAt: LessThan(beforeOneMinute), isListening: true },
    });

    await this.userRepository.save(users);
  }
}
