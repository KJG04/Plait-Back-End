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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database: 'plait',
      entities: [User, Content, Room],
      synchronize: true,
      namingStrategy: new SnakeNamingStrategy(),
      keepConnectionAlive: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      debug: false,
      playground: { settings: { 'request.credentials': 'include' } },
      driver: ApolloDriver,
      cors: {
        origin: 'https://localhost:3000',
        credentials: true,
      },
      context: (context) => context,
      installSubscriptionHandlers: true,
    }),
    RoomModule,
  ],
})
export class AppModule {}
