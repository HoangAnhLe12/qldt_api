/* eslint-disable prettier/prettier */
import { LeaveStatus } from "@prisma/client";
import { IsDateString, IsNotEmpty, registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

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

export class RequestAbsenceDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
  @IsNotEmpty()
  @IsDateString()
  @IsNotInThePast({ message: 'Date must not be in the past' })
  date: string;
  @IsNotEmpty()
  reason: string;
}

export class ReviewAbsenceRequestDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  requestId: string;
  @IsNotEmpty()
  status: LeaveStatus;
}

export class GetAbsenceRequestDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
}