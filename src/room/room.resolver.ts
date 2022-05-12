import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ForbiddenError } from 'apollo-server-express';
import { Room } from './entities/room.entity';
import JoinRoomInput from './interface/JoinRoomInput.interface';
import { RoomService } from './room.service';
import tokenName from 'src/constant/tokenName';

@Resolver(() => Room)
export class RoomResolver {
  constructor(private readonly roomService: RoomService) {}

  @Query(() => Int, { name: 'activeUserCount' })
  async getActiveUsers() {
    return this.roomService.getActiveUsers();
  }

  @Mutation(() => Boolean, { name: 'joinRoom' })
  async joinRoom(@Args('room') room: JoinRoomInput, @Context() context: any) {
    const cookieToken = context.req.cookies[tokenName];

    if (cookieToken) {
      //만약 이미 참여한 방이 있으면 방을 나간다
      await this.roomService.leaveRoom(cookieToken);
    }

    const token = await this.roomService.joinRoom(room);

    context.res.cookie(tokenName, token, {
      maxAge: 60 * 60 * 48,
      httpOnly: true,
    });

    return true;
  }

  @Mutation(() => String, { name: 'createRoom' })
  async createRoom(@Args('name') name: string, @Context() context: any) {
    const cookieToken = context.req.cookies[tokenName];

    if (cookieToken) {
      //만약 이미 참여한 방이 있으면 방을 나간다
      await this.roomService.leaveRoom(cookieToken);
    }

    const [code, token] = await this.roomService.createRoom(name);

    context.res.cookie(tokenName, token, {
      maxAge: 60 * 60 * 48,
      httpOnly: true,
    });

    return code;
  }

  @Mutation(() => Boolean, { name: 'leaveRoom' })
  async leaveRoom(@Context() context: any) {
    const token = context.req.cookies[tokenName];

    if (!token) {
      throw new ForbiddenError('참가한 방이 없으므로 방을 떠날 수 없습니다.');
    }

    await this.roomService.leaveRoom(token);
    context.res.cookie(tokenName, '', { maxAge: 0, httpOnly: true });

    return true;
  }
}
