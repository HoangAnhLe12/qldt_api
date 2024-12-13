/* eslint-disable prettier/prettier */
import { IsArray, IsDateString, IsNotEmpty } from "class-validator";
import { PresenceStatus } from "src/utils/enum";

export class takeAttendanceDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
  @IsDateString()
  date: string;
  @IsNotEmpty()
  @IsArray()
  students: string[];
}

export class getAttendanceRecordDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
}

export class setAttendanceRecordDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  attandanceId: string;
  @IsNotEmpty()
  status: PresenceStatus;
}

export class getAttendanceListDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
  @IsDateString()
  date: string;
}