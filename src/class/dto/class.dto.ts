import { IsDate, IsNegative, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  semester: string;
  description: string;
  @IsNotEmpty()
  @IsNegative()
  @IsNumber()
  maxStudent: number;
  @IsDate()
  @IsNotEmpty()
  startDate: Date;
  @IsDate()
  @IsNotEmpty()
  endDate: Date;
}

export class GetClassListDto {
  @IsNotEmpty()
  token: string;
}

export class EditClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  id: string;
  name: string;
  semester: string;
  description: string;
  @IsNegative()
  @IsNumber()
  maxStudent: number;
  startDate: Date;
  endDate: Date;
}

export class DeleteClassDto {
  @IsNotEmpty()
  token: string;
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
}

export class RegisterClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  id: string;
}
