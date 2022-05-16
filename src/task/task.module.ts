import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from 'src/room/entities/room.entity';
import { TaskService } from './task.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  providers: [TaskService],
  exports: [TypeOrmModule],
})
export class TaskModule {}
