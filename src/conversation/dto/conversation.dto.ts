import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  receiverId: string;
  @IsNotEmpty()
  message: string;
}

export class GetConversationDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  @Min(0)
  index: number;
  @IsNotEmpty()
  @IsPositive()
  count: number;
}

export class GetMessageListDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  conversationId: number;
  @IsNotEmpty()
  @IsNumber()
  index: number;
  @IsNotEmpty()
  @IsNumber()
  count: number;
}

export class MarkMessageReadDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  conversationId?: string;
}

export class DeleteMessageDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  messageId: string;
}

export class UpdateMessageDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  messageId: string;
  @IsOptional()
  newMessage?: string;
}

export class BlockUserDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  conversationId: string;
}
