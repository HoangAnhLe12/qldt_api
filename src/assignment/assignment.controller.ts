/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import {
  CreateAssingmentDto,
  DeleteAssingmentDto,
  GetAssignmentInfoDto,
  GetAssignmentListDto,
  SubmitAssignmentDto,
  UpdateAssingmentDto,
} from './dto/assignment.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('assignment')
export class AssignmentController {
  constructor(private assignmentService: AssignmentService) {}
  @Post('create-assignment')
  @UseInterceptors(FileInterceptor('file')) // Xử lý file từ FormData
  async createAssignment(
    @Body() body: CreateAssingmentDto,
    @UploadedFile() file: Express.Multer.File, // Xử lý file từ FormData
  ) {
    return this.assignmentService.createAssignment(body, file);
  }
  @Post('update-assignment')
  @UseInterceptors(FileInterceptor('file')) // Xử lý file từ FormData
  async updateAssignment(
    @Body() body: UpdateAssingmentDto,
    @UploadedFile() file: Express.Multer.File, // Xử lý file từ FormData
  ) {
    return this.assignmentService.updateAssignment(body, file);
  }
  @Post('delete-assignment')
  async deleteAssignment(@Body() body: DeleteAssingmentDto) {
    return this.assignmentService.deleteAssignment(body);
  }
  @Post('submit-assignment')
  @UseInterceptors(FileInterceptor('file')) // Xử lý file từ FormData
  async submitAssignment(
    @Body() body: SubmitAssignmentDto,
    @UploadedFile() file: Express.Multer.File, // Xử lý file từ FormData
  ) {
    return this.assignmentService.submitAssignment(body, file);
  }
  @Post('grade-assignment')
  async gradeAssignment(@Body() body: any) {
    return this.assignmentService.gradeAssignment(body);
  }
  @Post('get-assignment-list')
  async getAssignmentList(@Body() body: GetAssignmentListDto) {
    return this.assignmentService.getAssignmentList(body);
  }
  @Post('get-assignment-info')
  async getAssignmentInfo(@Body() body: GetAssignmentInfoDto) {
    return this.assignmentService.getAssignmentInfo(body);
  }
}
