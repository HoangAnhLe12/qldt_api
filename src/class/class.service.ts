/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateClassDto,
  DeleteClassDto,
  EditClassDto,
  GetClassInfoDto,
} from './dto/class.dto';

@Injectable()
export class ClassService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async createClass(createClass: CreateClassDto) {
    
    return createClass;
  }

  async getClassList(token: string) {
    return token;
  }

  async editClass(editClass: EditClassDto) {
    return editClass;
  }

  async deleteClass(token: DeleteClassDto) {
    return token;
  }

  async getClassInfo(getClassInfo: GetClassInfoDto) {
    return getClassInfo;
  }

  async getClassSchedule(token: string) {
    return token;
  }
}
