/* eslint-disable prettier/prettier */
import { Body, Controller, Post } from '@nestjs/common';
import { ClassService } from './class.service';
import {
  AddMemberDto,
  CreateClassDto,
  DeleteClassDto,
  EditClassDto,
  GetClassInfoDto,
  GetClassListDto,
  GetClassListsDto,
  GetClassScheduleDto,
} from './dto/class.dto';

@Controller('class')
export class ClassController {
  constructor(private classService: ClassService) {}

  @Post('create-class')
  createClass(@Body() body: CreateClassDto) {
    return this.classService.createClass(body);
  }

  @Post('get-class-list')
  getClassList(@Body() body: GetClassListDto) {
    return this.classService.getClassList(body);
  }

  @Post('edit-class')
  editClass(@Body() body: EditClassDto) {
    return this.classService.editClass(body);
  }

  @Post('delete-class')
  deleteClass(@Body() body: DeleteClassDto) {
    return this.classService.deleteClass(body);
  }

  @Post('add-member')
  addMember(@Body() body: AddMemberDto) {
    return this.classService.addMember(body);
  }

  @Post('get-class-info')
  getClassInfo(@Body() body: GetClassInfoDto) {
    return this.classService.getClassInfo(body);
  }

  @Post('get-class-schedule')
  getClassSchedule(@Body() body: GetClassScheduleDto) {
    return this.classService.getClassSchedule(body);
  }

  @Post('get-class-lists')
  getClassLists(@Body() body: GetClassListsDto) {
    return this.classService.getClassLists(body);
  }
}
