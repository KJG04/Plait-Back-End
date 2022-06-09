import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
class Emoji {
  @Field(() => String)
  emoji: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  color: string;

  @Field(() => Float)
  x: number;

  @Field(() => Float)
  y: number;
}

@InputType()
class EmojiInput {
  @Field(() => String)
  emoji: string;

  @Field(() => Float)
  x: number;

  @Field(() => Float)
  y: number;
}

export { Emoji, EmojiInput };
