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
import JoinRoomInput from './interface/JoinRoomInput.interface';
import { RoomService } from './room.service';
import { PubSub } from 'graphql-subscriptions';
import tokenName from 'src/constant/tokenName';
import subscriptionKeys from 'src/constant/subscriptionKeys';
import { Content, ContentType } from './entities/content.entity';

const pubSub = new PubSub();

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
      maxAge: 60 * 60 * 48 * 1000,
      httpOnly: true,
    });

    return true;
  }

  @Mutation(() => Room, { name: 'createRoom' })
  async createRoom(@Args('name') name: string, @Context() context: any) {
    const cookieToken = context.req.cookies[tokenName];

    if (cookieToken) {
      //만약 이미 참여한 방이 있으면 방을 나간다
      await this.roomService.leaveRoom(cookieToken);
    }

    const [room, token] = await this.roomService.createRoom(name);

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

    await this.roomService.leaveRoom(token);
    context.res.cookie(tokenName, '', { maxAge: 0, httpOnly: true });

    return true;
  }

  @Query(() => Boolean, { name: 'isContentPlaying' })
  async getIsContentPlaying(
    @Args('roomCode') roomCode: string,
    @Context() context: any,
  ) {
    const token = context.req.cookies[tokenName];
    await this.roomService.checkAuthenfication(token, roomCode);

    return this.roomService.getIsContentPlaying(roomCode);
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

    await pubSub.publish(`${subscriptionKeys.changeIsPlaying}_${roomCode}`, {
      isContentPlaying: changed,
    });

    return changed;
  }

  @Subscription(() => Boolean, { name: 'isContentPlaying' })
  async subscribeToIsPlaying(
    @Args('roomCode') roomCode: string,
    @Context() context: any,
  ) {
    const token = context.token;
    await this.roomService.checkAuthenfication(token, roomCode);

    await this.roomService.checkIsRoomExist(roomCode);

    return pubSub.asyncIterator(
      `${subscriptionKeys.changeIsPlaying}_${roomCode}`,
    );
  }

  @Query(() => [Content], { name: 'contents' })
  async getContents(
    @Args('roomCode') roomCode: string,
    @Context() context: any,
  ) {
    const token = context.req.cookies[tokenName];
    await this.roomService.checkAuthenfication(token, roomCode);

    return this.roomService.getContents(roomCode);
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

    const content = await this.roomService.pushContent(
      roomCode,
      userUuid,
      contentId,
      type,
    );

    await pubSub.publish(`${subscriptionKeys.changeContents}_${roomCode}`, {
      contents: content,
    });

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

    const contents = await this.roomService.removeContent(roomCode, uuid);

    await pubSub.publish(
      `${subscriptionKeys.changeContents}_${roomCode}`,
      contents,
    );

    return true;
  }

  @Subscription(() => [Content], { name: 'contents' })
  async subscribeToContents(
    @Args('roomCode') roomCode: string,
    @Context() context: any,
  ) {
    const token = context.token;
    await this.roomService.checkAuthenfication(token, roomCode);

    await this.roomService.checkIsRoomExist(roomCode);

    return pubSub.asyncIterator(
      `${subscriptionKeys.changeContents}_${roomCode}`,
    );
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

    return pubSub.asyncIterator(
      `${subscriptionKeys.listeningRoom}_${roomCode}_${userUuid}`,
    );
  @Query(() => Room, { name: 'joinedRoom' })
  async getJoinedRoom(@Context() context: any) {
    const token = context.req.cookies[tokenName];

    const room = await this.roomService.getRoomCodeByToken(token);

    return room;
  }
}
