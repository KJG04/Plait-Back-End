import { Field, ObjectType } from '@nestjs/graphql';
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
}
