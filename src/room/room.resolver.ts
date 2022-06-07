import {
  Args,
  Context,
  Int,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { ForbiddenError } from 'apollo-server-errors';
import { Room } from './entities/room.entity';
import { RoomService } from './room.service';
import tokenName from 'src/shared/tokenName';
import subscriptionKeys from 'src/shared/subscriptionKeys';
import { ContentType } from './entities/content.entity';
import { RedisPubSub } from 'graphql-redis-subscriptions';

const pubSub = new RedisPubSub();

@Resolver(() => Room)
export class RoomResolver {
  constructor(private readonly roomService: RoomService) {}

  @Query(() => Int, { name: 'activeUserCount' })
  async getActiveUsers() {
    return this.roomService.getActiveUsers();
  }

  @Mutation(() => Boolean, { name: 'joinRoom' })
  async joinRoom(
    @Args('roomCode') roomCode: string,
    @Args('name') name: string,
    @Context() context: any,
  ) {
    const cookieToken = context.req.cookies[tokenName];

    if (!!cookieToken) {
      //만약 이미 참여한 방이 있으면 방을 나간다
      try {
        const room = await this.roomService.leaveRoom(cookieToken);
        if (!!room) {
          const { code } = room;
          await this.roomService.afterUpdateRoom(code, pubSub);
        }
      } catch (error) {}
    }

    const token = await this.roomService.joinRoom({ name, roomCode });
    await this.roomService.afterUpdateRoom(roomCode, pubSub);

    context.res.cookie(tokenName, token, {
      maxAge: 60 * 60 * 48 * 1000,
      httpOnly: true,
    });

    return true;
  }

  @Mutation(() => Room, { name: 'createRoom' })
  async createRoom(@Args('name') name: string, @Context() context: any) {
    const cookieToken = context.req.cookies[tokenName];

    if (!!cookieToken) {
      //만약 이미 참여한 방이 있으면 방을 나간다
      try {
        const room = await this.roomService.leaveRoom(cookieToken);
        if (!!room) {
          const { code } = room;
          await this.roomService.afterUpdateRoom(code, pubSub);
        }
      } catch (error) {}
    }

    const [room, token] = await this.roomService.createRoom(name);
    await this.roomService.afterUpdateRoom(room.code, pubSub);

    context.res.cookie(tokenName, token, {
      maxAge: 60 * 60 * 48 * 1000,
      httpOnly: true,
    });

    return room;
  }

  @Mutation(() => Boolean, { name: 'leaveRoom' })
  async leaveRoom(@Context() context: any) {
    const token = context.req.cookies[tokenName];

    if (!token) {
      throw new ForbiddenError('참가한 방이 없으므로 방을 떠날 수 없습니다.');
    }

    const { code } = await this.roomService.leaveRoom(token);
    context.res.cookie(tokenName, '', { maxAge: 0, httpOnly: true });
    await this.roomService.afterUpdateRoom(code, pubSub);

    return true;
  }

  @Mutation(() => Boolean, { name: 'isContentPlaying' })
  async modifyIsContentPlaying(
    @Args('roomCode') roomCode: string,
    @Args('condition') condition: boolean,
    @Context() context: any,
  ) {
    const token = context.req.cookies[tokenName];
    await this.roomService.checkAuthenfication(token, roomCode);

    const changed = await this.roomService.modifyIsContentPlaying(
      roomCode,
      condition,
    );
    await this.roomService.afterUpdateRoom(roomCode, pubSub);

    return changed;
  }

  @Mutation(() => Boolean, { name: 'addContent' })
  async addContent(
    @Args('roomCode') roomCode: string,
    @Args('contentId') contentId: string,
    @Args('type', { type: () => ContentType }) type: ContentType,
    @Context() context: any,
  ) {
    const token = context.req.cookies[tokenName];
    const { userUuid } = await this.roomService.checkAuthenfication(
      token,
      roomCode,
    );

    await this.roomService.pushContent(roomCode, userUuid, contentId, type);
    await this.roomService.afterUpdateRoom(roomCode, pubSub);

    return true;
  }

  @Mutation(() => Boolean, { name: 'deleteContent' })
  async deleteContent(
    @Args('roomCode') roomCode: string,
    @Args('uuid') uuid: string,
    @Context() context: any,
  ) {
    const token = context.req.cookies[tokenName];
    await this.roomService.checkAuthenfication(token, roomCode);

    await this.roomService.removeContent(roomCode, uuid);
    await this.roomService.afterUpdateRoom(roomCode, pubSub);

    return true;
  }

  @Subscription(() => Boolean, { name: 'listening' })
  async listeningRoom(
    @Args('roomCode') roomCode: string,
    @Context() context: any,
  ) {
    const token = context.token;

    const { userUuid } = await this.roomService.checkAuthenfication(
      token,
      roomCode,
    );

    await this.roomService.checkIsRoomExist(roomCode);
    await this.roomService.listeningRoom(roomCode, userUuid);

    return pubSub.asyncIterator(
      `${subscriptionKeys.listeningRoom}_${roomCode}_${userUuid}`,
    );
  }

  @Subscription(() => Boolean, { name: 'listening' })
  async listening(@Args('roomCode') roomCode: string, @Context() context: any) {
    const token = context.token;

    await this.roomService.checkAuthenfication(token, roomCode);
    await this.roomService.checkIsRoomExist(roomCode);

    return pubSub.asyncIterator(`${subscriptionKeys.listening}`);
  }

  @Mutation(() => Boolean, { name: 'listeningInterval' })
  async postListeningInterval(
    @Args('roomCode') roomCode: string,
    @Context() context: any,
  ) {
    const token = context.req.cookies[tokenName];

    const { userUuid } = await this.roomService.checkAuthenfication(
      token,
      roomCode,
    );

    await this.roomService.updateLastListeng(roomCode, userUuid);

    return true;
  }

  @Query(() => Boolean, { name: 'checkIsRoomExist' })
  async checkIsRoomExist(@Args('roomCode') roomCode: string) {
    await this.roomService.checkIsRoomExist(roomCode);

    return true;
  }

  @Query(() => Boolean, { name: 'checkCanJoinRoom' })
  async checkCanJoinRoom(
    @Args('roomCode') roomCode: string,
    @Context() context: any,
  ) {
    const token = context.req.cookies[tokenName];
    await this.roomService.checkAuthenfication(token, roomCode);
    await this.roomService.checkIsRoomExist(roomCode);

    return true;
  }

  @Subscription(() => Room, { name: 'room' })
  async subscriptionRoom(
    @Args('roomCode') roomCode: string,
    @Context() context: any,
  ) {
    const token = context.token;

    await this.roomService.checkAuthenfication(token, roomCode);
    await this.roomService.checkIsRoomExist(roomCode);

    return pubSub.asyncIterator(`${subscriptionKeys.changeRoom}_${roomCode}`);
  }

  @Query(() => Room, { name: 'room' })
  async getRoom(@Args('roomCode') roomCode: string, @Context() context: any) {
    const token = context.req.cookies[tokenName];
    await this.roomService.checkAuthenfication(token, roomCode);

    return await this.roomService.findRoom(roomCode);
  }

  @Query(() => Room, { name: 'joinedRoom' })
  async getJoinedRoom(@Context() context: any) {
    const token = context.req.cookies[tokenName];

    const room = await this.roomService.getRoomCodeByToken(token);

    return room;
  }
}
