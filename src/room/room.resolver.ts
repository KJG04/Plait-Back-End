import { Int, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Room } from './entities/room.entity';
import { RoomService } from './room.service';

@Resolver(() => Room)
export class RoomResolver {
  constructor(private readonly roomService: RoomService) {}
  @Query(() => Int, { name: 'activeUserCount' })
  async getActiveUsers() {
    return this.roomService.getActiveUsers();
  }
}
