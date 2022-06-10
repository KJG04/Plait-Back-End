import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomModule } from './room/room.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { User } from './room/entities/user.entity';
import { Content } from './room/entities/content.entity';
import { Room } from './room/entities/room.entity';
import getCookie from './shared/getCookie';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Content, Room],
      synchronize: true,
      namingStrategy: new SnakeNamingStrategy(),
      keepConnectionAlive: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      debug: false,
      playground: {
        settings: { 'request.credentials': 'include' },
      },
      driver: ApolloDriver,
      cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      },
      context: (context) => context,
      subscriptions: {
        'subscriptions-transport-ws': {
          path: '/graphql',
          onConnect: (_, webSocket) => {
            const cookie = webSocket.upgradeReq.headers.cookie;
            const token = getCookie(cookie, 'token');

            return { token: token };
          },
        },
      },
    }),
    RoomModule,
    TaskModule,
  ],
})
export class AppModule {}
