/* eslint-disable prettier/prettier */
import { Body, Controller, Post } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import {
  GetAttendanceListDto,
  GetAttendanceRecordDto,
  SetAttendanceStatusDto,
  TakeAttendanceDto,
} from './dto/attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}
  @Post('take-attendance')
  async takeAttendance(@Body() body: TakeAttendanceDto) {
    return this.attendanceService.takeAttendance(body);
  }
  @Post('get-attendance-record')
  async getAttendanceRecord(@Body() body: GetAttendanceRecordDto) {
    return this.attendanceService.getAttendanceRecord(body);
  }
  @Post('set-attendance-status')
  async setAttendanceStatus(@Body() body: SetAttendanceStatusDto) {
    return this.attendanceService.setAttendanceStatus(body);
  }
  @Post('get-attendance-list')
  async getAttendanceList(@Body() body: GetAttendanceListDto) {
    return this.attendanceService.getAttendanceList(body);
  }
}
