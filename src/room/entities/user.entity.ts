import { Field, ObjectType } from '@nestjs/graphql';
import { nanoid } from 'nanoid';
import colors from 'src/constant/colors';
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
  id: number;

  @Field(() => String)
  @Column({ length: 36 })
  uuid: string;

  @Field(() => String)
  @Column({ type: 'varchar', length: 36 })
  name: string;

  @Field(() => String)
  @Column({ type: 'varchar', length: 6 })
  color: string;

  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.users, { onDelete: 'CASCADE' })
  room: Room;

  @Field(() => [Content])
  @OneToMany(() => Content, (content) => content.user)
  contents: Content[];

  static create(name: string, room: Room) {
    const user = new User();

    const colorValues = [...Object.values(colors)];
    const color =
      colorValues[Math.floor(Math.random() * colorValues.length - 1)];

    user.color = color;
    user.contents = [];
    user.name = name;
    user.room = room;
    user.uuid = nanoid(36);

    return user;
  }
}
