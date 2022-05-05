import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomResolver } from './room.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { User } from './entities/user.entity';
import { Content } from './entities/content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, User, Content])],
  exports: [TypeOrmModule],
  providers: [RoomService, RoomResolver],
})
export class RoomModule {}
