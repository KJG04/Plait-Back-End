import { Field, ObjectType } from '@nestjs/graphql';
import { IsDate, IsInt, IsString } from 'class-validator';
import { nanoid } from 'nanoid';
import colors from 'src/shared/colors';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Content } from './content.entity';
import { Room } from './room.entity';

@ObjectType()
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @IsInt()
  id: number;

  @Field(() => String)
  @Column({ length: 36 })
  @IsString()
  uuid: string;

  @Field(() => String)
  @Column({ length: 36 })
  @IsString()
  name: string;

  @Field(() => String)
  @Column({ length: 6 })
  @IsString()
  color: string;

  @Field(() => Boolean)
  @Column()
  isDeleted: boolean;

  @Field(() => Boolean)
  @Column()
  isListening: boolean;

  @Field(() => Date)
  @Column()
  @IsDate()
  lastListeningAt: Date;

  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.users, { onDelete: 'CASCADE' })
  room: Room;

  @Field(() => [Content])
  @OneToMany(() => Content, (content) => content.user, { cascade: true })
  contents: Content[];

  static create(name: string, room: Room) {
    const user = new User();

    const colorValues = [...Object.values(colors)];
    const color = colorValues[Math.floor(Math.random() * colorValues.length)];

    user.color = color;
    user.name = name;
    user.room = room;
    user.uuid = nanoid(36);
    user.isDeleted = false;
    user.isListening = true;
    user.lastListeningAt = new Date();

    return user;
  }
}
