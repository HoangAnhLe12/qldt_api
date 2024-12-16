/* eslint-disable prettier/prettier */
import { IsBoolean, IsDateString,  IsNotEmpty, IsNumber, IsOptional, IsPositive, Max, MaxLength, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { ClassType } from 'src/utils/enum';
@ValidatorConstraint({ name: 'IsTimeEndAfterTimeStart', async: false })
export class IsTimeEndAfterTimeStart implements ValidatorConstraintInterface {
  validate(timeEnd: string, args: ValidationArguments): boolean {
    const body = args.object as any; // Lấy toàn bộ DTO object
    const timeStart = new Date(body.timeStart); // Chuyển đổi timeStart thành Date
    const end = new Date(timeEnd); // Chuyển đổi timeEnd thành Date

    return end >= timeStart; // Kiểm tra timeEnd >= timeStart
  }

  defaultMessage(): string {
    return 'timeEnd must be greater than or equal to timeStart';
  }
}


export class CreateClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  @MaxLength(50)
  className: string;
  @IsNotEmpty()
  semester: string;
  @IsNotEmpty()
  type: ClassType;
  @IsOptional()
  @MaxLength(255)
  description?: string;
  @IsOptional()
  sessions?: {
    dayOfWeek: string; // Ví dụ: "Thứ 4"
    startTime: string; // Ví dụ: "12h30"
    endTime: string; // Ví dụ: "14h30"
  }[];;
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  @Max(125)
  maxStudent: number;
  @IsDateString()
  @IsNotEmpty()
  timeStart: string;
  @IsDateString()
  @IsNotEmpty()
  @Validate(IsTimeEndAfterTimeStart)
  timeEnd: string;
}

export class GetClassListDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  @IsNumber()
  userId: number;
  @IsNotEmpty()
  role: string;
}

export class EditClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: number;
  @IsOptional()
  @MaxLength(50)
  className?: string;
  @IsOptional()
  @MaxLength(255)
  description?: string;
  @IsOptional()
  type?: ClassType;
  @IsOptional()
  @IsPositive()
  @IsNumber()
  @Max(125)
  maxStudent?: number;
  @IsOptional()
  @IsDateString()
  timeStart?: string;
  @IsOptional()
  @IsDateString()
  @Validate(IsTimeEndAfterTimeStart)
  timeEnd?: string;
  @IsOptional()
  semester?: string;
  @IsOptional()
  sessions?: {
    dayOfWeek: string; // Ví dụ: "Thứ 4"
    startTime: string; // Ví dụ: "12h30"
    endTime: string; // Ví dụ: "14h30"
  }[];;
  @IsOptional()
  @IsBoolean()
  classStatus?: boolean;
}

export class DeleteClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  userId: number;
  @IsNotEmpty()
  classId: number;
}

export class GetClassInfoDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
}

export class AddMemberDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  @IsNumber()
  userId: number;
  @IsNotEmpty()
  @IsNumber()
  classId: number;
}

export class GetClassScheduleDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
}

export class RegisterClassDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
}

export class GetClassListsDto {
  @IsNotEmpty()
  token: string;
}
