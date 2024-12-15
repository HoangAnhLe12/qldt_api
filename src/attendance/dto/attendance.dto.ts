/* eslint-disable prettier/prettier */
import { IsArray, IsDateString, IsNotEmpty, registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

// Custom decorator để kiểm tra ngày không phải là quá khứ
function IsNotInThePast(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotInThePast',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const now = new Date();
          const inputDate = new Date(value);
          return inputDate >= now; // Ngày phải lớn hơn hoặc bằng ngày hiện tại
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be in the past`;
        },
      },
    });
  };
}

export class TakeAttendanceDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
  @IsDateString()
  @IsNotInThePast({ message: 'Date must not be in the past' })
  date: string;
  @IsNotEmpty()
  @IsArray()
  students: string[];
}

export class GetAttendanceRecordDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
}

export class SetAttendanceStatusDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  attendanceId: string;
  @IsNotEmpty()
  newStudentsList: string[];
}

export class GetAttendanceListDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
  @IsDateString()
  date: string;
}