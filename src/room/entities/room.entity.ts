import { Field, Int, ObjectType } from '@nestjs/graphql';
import { nanoid } from 'nanoid';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Content } from './content.entity';
import { User } from './user.entity';

@ObjectType()
@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({ length: 6 })
  code: string;

  @Field(() => Boolean)
  @Column()
  isPlaying: boolean;

  @Field(() => Int)
  @Column()
  playTime: number;

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

    return room;
  }
}
