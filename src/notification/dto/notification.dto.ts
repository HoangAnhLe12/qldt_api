/* eslint-disable prettier/prettier */
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';

export class SendNotificationDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  type: string;
  @IsNotEmpty()
  @MaxLength(20)
  message: string;
  @IsOptional()
  relatedId: string;
}

export class GetNotificationDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  index: number;
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  @Min(1)
  count: number;
}

export class MarkNotificationDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  @IsArray()
  notificationIds: number[];
}
