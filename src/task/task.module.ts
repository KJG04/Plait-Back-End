import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from 'src/room/entities/room.entity';
import { TaskService } from './task.service';
import { User } from 'src/room/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, User])],
  providers: [TaskService],
  exports: [TypeOrmModule],
})
export class TaskModule {}
