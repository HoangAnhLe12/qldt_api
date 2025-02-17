/* eslint-disable prettier/prettier */
import { Body, Controller, Post } from '@nestjs/common';
import { AbsenceService } from './absence.service';
import {
  GetAbsenceRequestDto,
  RequestAbsenceDto,
  ReviewAbsenceRequestDto,
} from './dto/absence.dto';

@Controller('absence')
export class AbsenceController {
  constructor(private absenceService: AbsenceService) {}
  @Post('request-absence')
  async requestAbsence(@Body() body: RequestAbsenceDto) {
    return this.absenceService.requestAbsence(body);
  }
  @Post('review-absence-request')
  async reviewAbsenceRequest(@Body() body: ReviewAbsenceRequestDto) {
    return this.absenceService.reviewAbsenceRequest(body);
  }
  @Post('get-absence-request')
  async getAbsenceRequest(@Body() body: GetAbsenceRequestDto) {
    return this.absenceService.getAbsenceRequest(body);
  }
}
