import { Field, InputType } from '@nestjs/graphql';

@InputType()
class JoinRoomInput {
  @Field(() => String)
  roomCode: string;

  @Field(() => String)
  name: string;
}

export default JoinRoomInput;
