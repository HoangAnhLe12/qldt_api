/* eslint-disable prettier/prettier */
import { IsDateString, IsNotEmpty } from "class-validator";
import { LeaveStatus } from "src/utils/enum";

export class requestAbsence {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
  @IsNotEmpty()
  @IsDateString()
  date: string;
  @IsNotEmpty()
  reason: string;
}

export class reviewAbsenceRequest {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  requestId: string;
  @IsNotEmpty()
  status: LeaveStatus;
}

export class getAbsenceRequest {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
}