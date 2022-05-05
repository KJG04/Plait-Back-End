import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';

enum ContentType {
  YOUTUBE,
  SOUNDCLOUD,
}

registerEnumType(ContentType, { name: 'ContentType' });

@ObjectType()
@Entity()
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({ length: 36 })
  uuid: string;

  @Field(() => String)
  @Column({ type: 'varchar', length: 36 })
  contentId: string;

  @Field(() => ContentType)
  @Column({ type: 'enum', enum: ContentType })
  contentType: ContentType;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.contents)
  user: User;

  @Field(() => Room)
  @ManyToOne(() => Room, (room) => room.contents, { onDelete: 'CASCADE' })
  room: Room;
}
