/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  GetAbsenceRequestDto,
  RequestAbsenceDto,
  ReviewAbsenceRequestDto,
} from './dto/absence.dto';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class AbsenceService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}
  async requestAbsence(body: RequestAbsenceDto) {
    try {
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(body.token, {
          secret: process.env.JWT_SECRET,
        });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
        }
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const { sub: userId, role } = decodedToken;

      const student = await this.prismaService.student.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!student) {
        throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
      }

      if (role !== 'STUDENT') {
        throw new HttpException(
          'Only students can request an absence',
          HttpStatus.FORBIDDEN,
        );
      }

      const classId = parseInt(body.classId, 10);

      if (Number.isNaN(classId)) {
        throw new HttpException(
          'Khong tim thay lop hoc nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const userClass = await this.prismaService.class.findUnique({
        where: {
          id: classId,
        },
        include: {
          students: true,
        },
      });

      if (!userClass) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }
      if (userClass.students.every((student) => student.userId !== userId)) {
        throw new HttpException(
          'You are not enrolled in this class',
          HttpStatus.FORBIDDEN,
        );
      }

      const classStartDate = new Date(userClass.timeStart);
      const classEndDate = new Date(userClass.timeEnd);
      const absenceDate = new Date(body.date);

      if (absenceDate < classStartDate || absenceDate > classEndDate) {
        throw new HttpException(
          'Absence date is outside the class start and end dates',
          HttpStatus.BAD_REQUEST,
        );
      }

      const absenceRequest = await this.prismaService.absenceRequest.create({
        data: {
          studentId: student.id,
          classId: classId,
          date: absenceDate,
          reason: body.reason,
          status: 'DANG_XU_LY',
          responseTime: null,
        },
      });

      return {
        code: 1000,
        message: 'Absence request created',
        data: {
          id: absenceRequest.id,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async reviewAbsenceRequest(body: ReviewAbsenceRequestDto) {
    try {
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(body.token, {
          secret: process.env.JWT_SECRET,
        });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
        }
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const { sub: userId, role } = decodedToken;

      const lecturer = await this.prismaService.lecturer.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!lecturer) {
        throw new HttpException('Teacher not found', HttpStatus.NOT_FOUND);
      }

      if (role !== 'LECTURER') {
        throw new HttpException(
          'Only teachers can review an absence request',
          HttpStatus.FORBIDDEN,
        );
      }

      const absenceRequestId = parseInt(body.requestId, 10);

      if (Number.isNaN(absenceRequestId)) {
        throw new HttpException(
          'Khong tim thay yeu cau nghi hoc nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const absenceRequest = await this.prismaService.absenceRequest.findUnique(
        {
          where: {
            id: absenceRequestId,
          },
          include: {
            student: true,
            class: true,
          },
        },
      );

      if (!absenceRequest) {
        throw new HttpException(
          'Absence request not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (absenceRequest.class.lecturerId !== lecturer.id) {
        throw new HttpException(
          'You are not the teacher of this class',
          HttpStatus.FORBIDDEN,
        );
      }

      if (absenceRequest.status !== 'DANG_XU_LY') {
        throw new HttpException(
          'Absence request has been reviewed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const status = body.status as LeaveStatus;

      await this.prismaService.absenceRequest.update({
        where: {
          id: absenceRequestId,
        },
        data: {
          status: status,
          responseTime: new Date(),
        },
      });

      return {
        code: 1000,
        message: 'Absence request reviewed',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getAbsenceRequest(body: GetAbsenceRequestDto) {
    try {
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(body.token, {
          secret: process.env.JWT_SECRET,
        });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
        }
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const { sub: userId, role } = decodedToken;

      if (role !== 'LECTURER') {
        throw new HttpException(
          'Only teachers can get absence requests',
          HttpStatus.FORBIDDEN,
        );
      }

      const lecturer = await this.prismaService.lecturer.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!lecturer) {
        throw new HttpException('Teacher not found', HttpStatus.NOT_FOUND);
      }

      const classId = parseInt(body.classId, 10);

      if (Number.isNaN(classId)) {
        throw new HttpException(
          'Khong tim thay lop hoc nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const userClass = await this.prismaService.class.findUnique({
        where: {
          id: classId,
        },
        include: {
          lecturer: true,
        },
      });

      if (!userClass) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      if (userClass.lecturerId !== lecturer.id) {
        throw new HttpException(
          'You are not the teacher of this class',
          HttpStatus.FORBIDDEN,
        );
      }

      const absenceRequests = await this.prismaService.absenceRequest.findMany({
        where: {
          classId: classId,
        },
        include: {
          student: true,
        },
      });

      if (absenceRequests.length === 0) {
        return {
          code: 1001,
          message: 'No absence requests found',
        };
      }
      return {
        code: 1000,
        message: 'Absence requests found',
        data: {
          absenceRequests: absenceRequests.map((absenceRequest) => ({
            id: absenceRequest.id,
            student: absenceRequest.student.id,
            date: absenceRequest.date,
            reason: absenceRequest.reason,
            status: absenceRequest.status,
          })),
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
