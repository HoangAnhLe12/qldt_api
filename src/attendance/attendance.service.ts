/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  GetAttendanceListDto,
  GetAttendanceRecordDto,
  SetAttendanceStatusDto,
  TakeAttendanceDto,
} from './dto/attendance.dto';
import { PresenceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}
  async takeAttendance(body: TakeAttendanceDto) {
    try {
      // 1. Decode và xác thực token
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
          'Only lecturers can take attendance',
          HttpStatus.FORBIDDEN,
        );
      }

      // 2. Tìm giảng viên theo userId
      const lecturer = await this.prismaService.lecturer.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!lecturer) {
        throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
      }

      const classId = parseInt(body.classId, 10);

      if (Number.isNaN(classId)) {
        throw new HttpException(
          'Khong tim thay lop hoc nay',
          HttpStatus.NOT_FOUND,
        );
      }

      // 3. Kiểm tra giảng viên có quản lý lớp này không
      const lecturerClass = await this.prismaService.class.findUnique({
        where: {
          id: classId,
        },
        include: {
          lecturer: true,
          students: true,
          attendance: true,
        },
      });

      if (!lecturerClass || lecturerClass.lecturerId !== lecturer.id) {
        throw new HttpException(
          'You do not have permission to take attendance for this class',
          HttpStatus.FORBIDDEN,
        );
      }

      const attendanceDate = new Date(body.date);
      const now = new Date();
      if (
        attendanceDate < lecturerClass.timeStart ||
        attendanceDate > lecturerClass.timeEnd
      ) {
        throw new HttpException(
          'Ngay diem danh phai o trong lich hoc cua lop',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (attendanceDate < now) {
        throw new HttpException(
          'Ngay diem danh khong phai la ngay trong qua khu',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Kiểm tra nếu ngày đó đã có điểm danh
      const existingAttendance = lecturerClass.attendance.find(
        (att) => att.date.toDateString() === attendanceDate.toDateString(),
      );

      if (existingAttendance) {
        throw new HttpException(
          'Attendance has already been taken for this date',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 4. Kiểm tra danh sách sinh viên vắng mặt
      const absentStudentIds = body.students.map((id) => parseInt(id, 10));
      const allStudentIds = lecturerClass.students.map((student) => student.id);

      const invalidStudentIds = absentStudentIds.filter(
        (id) => !allStudentIds.includes(id),
      );

      if (invalidStudentIds.length > 0) {
        throw new HttpException(
          `Invalid student IDs: ${invalidStudentIds.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 5. Tạo bản ghi điểm danh (Attendance)
      const attendance = await this.prismaService.attendance.create({
        data: {
          classId: classId,
          date: attendanceDate,
        },
      });

      // 6. Tạo các bản ghi AttendanceStatus
      const attendanceStatuses = lecturerClass.students.map((student) => ({
        studentId: student.id,
        attendanceId: attendance.id,
        status: absentStudentIds.includes(student.id)
          ? PresenceStatus.VANG_MAT
          : PresenceStatus.CO_MAT,
      }));

      await this.prismaService.attendanceStatus.createMany({
        data: attendanceStatuses,
      });

      return {
        message: 'Attendance has been successfully recorded',
        attendanceId: attendance.id,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAttendanceRecord(body: GetAttendanceRecordDto) {
    try {
      // 1. Decode và xác thực token
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

      if (role !== 'STUDENT') {
        throw new HttpException(
          'Only students can get attendance record',
          HttpStatus.FORBIDDEN,
        );
      }

      const student = await this.prismaService.student.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!student) {
        throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
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
          attendance: {
            include: {
              records: {
                where: {
                  studentId: student.id,
                },
                select: {
                  id: true,
                  status: true,
                  attendance: {
                    select: {
                      date: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!userClass || !userClass.students.some((s) => s.id === student.id)) {
        throw new HttpException(
          'You are not enrolled in this class',
          HttpStatus.FORBIDDEN,
        );
      }

      const attendanceRecords = userClass.attendance.flatMap((attendance) =>
        attendance.records.map((record) => ({
          attendanceId: record.id,
          date: record.attendance.date,
          status: record.status,
        })),
      );

      return {
        classId: userClass.id,
        className: userClass.name,
        attendanceRecords,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async setAttendanceStatus(body: SetAttendanceStatusDto) {
    try {
      // 1. Decode và xác thực token
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
          'Only lecturers can update attendance status',
          HttpStatus.FORBIDDEN,
        );
      }

      const lecturer = await this.prismaService.lecturer.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!lecturer) {
        throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
      }

      const attendanceId = parseInt(body.attendanceId, 10);

      if (Number.isNaN(attendanceId)) {
        throw new HttpException(
          'Khong tim thay lan diem danh nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const attendance = await this.prismaService.attendance.findUnique({
        where: {
          id: attendanceId,
        },
        include: {
          class: {
            include: {
              lecturer: true,
            },
          },
          records: true,
        },
      });

      if (!attendance || attendance.class.lecturerId !== lecturer.id) {
        throw new HttpException(
          'You do not have permission to update attendance for this class',
          HttpStatus.FORBIDDEN,
        );
      }

      const newStudentIds = body.newStudentsList.map((id) => parseInt(id, 10));
      const existingStudentIds = attendance.records.map(
        (record) => record.studentId,
      );

      const invalidStudentIds = newStudentIds.filter(
        (id) => !existingStudentIds.includes(id),
      );

      if (invalidStudentIds.length > 0) {
        throw new HttpException(
          `Invalid student IDs: ${invalidStudentIds.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedRecords = attendance.records.map((record) => {
        const isInNewList = newStudentIds.includes(record.studentId);
        const newStatus = isInNewList
          ? record.status === 'CO_MAT'
            ? 'VANG_MAT'
            : 'CO_MAT'
          : record.status;
        return {
          id: record.id,
          status: newStatus,
        };
      });

      await Promise.all(
        updatedRecords.map((record) =>
          this.prismaService.attendanceStatus.update({
            where: {
              id: record.id,
            },
            data: {
              status: record.status,
            },
          }),
        ),
      );

      return {
        message: 'Attendance status updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAttendanceList(body: GetAttendanceListDto) {
    try {
      // 1. Decode và xác thực token
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
          'Only lecturers can access student attendance',
          HttpStatus.FORBIDDEN,
        );
      }

      const lecturer = await this.prismaService.lecturer.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!lecturer) {
        throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
      }

      const classId = parseInt(body.classId, 10);

      if (Number.isNaN(classId)) {
        throw new HttpException(
          'Khong tim thay lop hoc nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const lecturerClass = await this.prismaService.class.findUnique({
        where: {
          id: classId,
        },
        include: {
          lecturer: true,
          attendance: {
            where: {
              date: new Date(body.date),
            },
            include: {
              records: {
                include: {
                  student: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!lecturerClass || lecturerClass.lecturerId !== lecturer.id) {
        throw new HttpException(
          'You do not have permission to access this class',
          HttpStatus.FORBIDDEN,
        );
      }

      const attendanceForDate = lecturerClass.attendance[0];

      if (!attendanceForDate) {
        throw new HttpException(
          'No attendance record found for the specified date',
          HttpStatus.NOT_FOUND,
        );
      }

      const attendanceRecords = attendanceForDate.records.map((record) => ({
        studentId: record.student.id,
        status: record.status,
      }));

      return {
        classId: lecturerClass.id,
        date: attendanceForDate.date,
        attendanceRecords,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
