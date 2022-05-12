import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Room } from './entities/room.entity';
import JoinRoomInput from './input/JoinRoomInput.interface';
import { RoomService } from './room.service';

@Resolver(() => Room)
export class RoomResolver {
  constructor(private readonly roomService: RoomService) {}
  @Query(() => Int, { name: 'activeUserCount' })
  async getActiveUsers() {
    return this.roomService.getActiveUsers();
  }

  @Mutation(() => Boolean, { name: 'joinRoom' })
  async joinRoom(@Args('room') room: JoinRoomInput) {
    return this.roomService.joinRoom(room);
  }

  @Mutation(() => String, { name: 'createRoom' })
  async createRoom(@Args('name') name: string) {
    return this.roomService.createRoom(name);
  }
}
