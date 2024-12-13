/* eslint-disable prettier/prettier */
import { IsDateString, IsNegative, IsNotEmpty, IsNumber, IsOptional, Max, MaxLength } from 'class-validator';

export class CreateClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  @MaxLength(50)
  className: string;
  @IsNotEmpty()
  semester: string;
  @IsOptional()
  @MaxLength(255)
  description?: string;
  @IsNotEmpty()
  @IsNegative()
  @IsNumber()
  @Max(125)
  maxStudent: number;
  @IsDateString()
  @IsNotEmpty()
  startDate: string;
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}

export class GetClassListDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  role: string;
}

export class EditClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  id: string;
  @IsOptional()
  @MaxLength(50)
  className?: string;
  @IsOptional()
  @MaxLength(255)
  description?: string;
  @IsOptional()
  @IsNegative()
  @IsNumber()
  @Max(125)
  maxStudent?: number;
  @IsOptional()
  @IsDateString()
  startDate?: string;
  @IsOptional()
  endDate?: string;
  @IsOptional()
  classStatus?: string;
}

export class DeleteClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  id: string;
}

export class GetClassInfoDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  id: string;
}

export class GetClassScheduleDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  id: string;
}

export class RegisterClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  id: string;
}
