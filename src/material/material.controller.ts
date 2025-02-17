/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import {
  createMaterialDto,
  deleteMaterialDto,
  editMaterialDto,
  getMaterialInfoDto,
  getMaterialListDto,
} from './dto/material.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('material')
export class MaterialController {
  constructor(private readonly studyMaterialService: MaterialService) {}

  @Post('create-material')
  @UseInterceptors(FileInterceptor('file')) // Xử lý file từ FormData
  async uploadMaterial(
    @Body() body: createMaterialDto, // Lấy thông tin JSON
    @UploadedFile() file: Express.Multer.File, // Xử lý file từ FormData
  ) {
    return this.studyMaterialService.uploadStudyMaterial(body, file);
  }
  @Post('edit-material')
  @UseInterceptors(FileInterceptor('file')) // Xử lý file từ FormData
  async editMaterial(
    @Body() body: editMaterialDto, // Lấy thông tin JSON
    @UploadedFile() file: Express.Multer.File, // Xử lý file từ FormData
  ) {
    return this.studyMaterialService.editMaterial(body, file);
  }
  @Post('delete-material')
  async deleteMaterial(@Body() body: deleteMaterialDto) {
    return this.studyMaterialService.deleteMaterial(body);
  }
  @Get('get-material-list')
  async getMaterialList(@Query() body: getMaterialListDto) {
    return this.studyMaterialService.getMaterialList(body);
  }
  @Get('get-material-info')
  async getMaterialInfo(@Query() body: getMaterialInfoDto) {
    return this.studyMaterialService.getMaterialInfo(body);
  }
}
