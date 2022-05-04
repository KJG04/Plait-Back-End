import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Content } from './content.entity';
import { User } from './user.entity';

@ObjectType()
@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column({ length: 36 })
  uuid: string;

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
}
