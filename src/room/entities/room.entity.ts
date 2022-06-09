import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsDate, IsInt, IsString } from 'class-validator';
import { nanoid } from 'nanoid';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Content } from './content.entity';
import { User } from './user.entity';

@ObjectType()
@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  @IsInt()
  id: number;

  @Field(() => String)
  @Column({ length: 6 })
  @IsString()
  code: string;

  @Field(() => Boolean)
  @Column()
  @IsBoolean()
  isPlaying: boolean;

  @Field(() => Int)
  @Column()
  @IsInt()
  playTime: number;

  @Field(() => Date)
  @Column()
  @IsDate()
  createdAt: Date;

  @Field(() => [User])
  @OneToMany(() => User, (user) => user.room, { cascade: true })
  users: User[];

  @Field(() => [Content])
  @OneToMany(() => Content, (content) => content.room, { cascade: true })
  contents: Content[];

  static create() {
    const room = new Room();
    room.code = nanoid(6);
    room.isPlaying = false;
    room.playTime = 0;
    room.createdAt = new Date();

    return room;
  }
}
