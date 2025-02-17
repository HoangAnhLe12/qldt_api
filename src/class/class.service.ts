/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
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
import { ClassType } from '@prisma/client';

@Injectable()
export class ClassService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}
  async createClass(body: CreateClassDto) {
    try {
      // Giải mã token
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

      const { sub, role } = decodedToken;

      // Kiểm tra vai trò (chỉ giảng viên mới được tạo lớp học)
      if (role !== 'LECTURER') {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Kiểm tra thông tin giảng viên
      const lecturer = await this.prismaService.lecturer.findUnique({
        where: { userId: sub },
      });
      if (!lecturer) {
        throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra tài khoản có đang hoạt động không
      const user = await this.prismaService.user.findUnique({
        where: { id: sub },
      });
      if (!user || !user.active) {
        throw new HttpException('Account is not active', HttpStatus.FORBIDDEN);
      }

      const type = body.type as unknown as ClassType;

      try {
        // Tạo lớp học
        const newClass = await this.prismaService.class.create({
          data: {
            name: body.className,
            description: body.description,
            lecturerId: lecturer.id,
            maxStudents: body.maxStudent,
            type: type,
            semester: body.semester,
            timeStart: new Date(body.timeStart),
            timeEnd: new Date(body.timeEnd),
          },
        });
        // Thêm ClassSessions
        if (body.sessions && body.sessions.length > 0) {
          const sessionData = body.sessions.map((session) => ({
            classId: newClass.id,
            dayOfWeek: session.dayOfWeek,
            startTime: session.startTime,
            endTime: session.endTime,
          }));

          await this.prismaService.classSession.createMany({
            data: sessionData,
          });
        }
        return {
          code: 1000,
          message: 'Class created successfully',
          class: newClass.id,
        };
      } catch (error) {
        throw new Error(error + 'Failed to create class'); // ném ra lỗi để thông báo
      }
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getClassList(body: GetClassListDto) {
    try {
      // Giải mã token
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

      const { sub, role } = decodedToken;

      if (sub !== body.userId || role !== body.role) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Kiểm tra trạng thái kích hoạt của tài khoản
      const user = await this.prismaService.user.findUnique({
        where: { id: sub },
      });

      if (!user || !user.active) {
        throw new HttpException(
          'User account is inactive or not found',
          HttpStatus.FORBIDDEN,
        );
      }

      let classes;
      if (role === 'LECTURER') {
        const lecturer = await this.prismaService.lecturer.findUnique({
          where: { userId: sub },
        });
        // Lấy danh sách lớp học của giảng viên
        classes = await this.prismaService.class.findMany({
          where: { lecturerId: lecturer.id },
          include: {
            lecturer: {
              include: {
                user: true, // Bao gồm thông tin người dùng của giảng viên
              },
            },
            students: true,
          },
        });
      } else if (role === 'STUDENT') {
        // Lấy danh sách lớp học của sinh viên
        classes = await this.prismaService.class.findMany({
          where: {
            students: {
              some: { userId: sub },
            },
          },
          include: {
            lecturer: {
              include: {
                user: true, // Bao gồm thông tin người dùng của giảng viên
              },
            },
            students: true,
          },
        });
      } else {
        throw new HttpException('Invalid role', HttpStatus.FORBIDDEN);
      }

      const classList = classes.map((cls) => ({
        classId: cls.id,
        className: cls.name,
        lecturerName: cls.lecturer?.user?.username || 'Unknown', // Lấy tên giảng viên
        studentCount: cls.students.length,
        timeStart: cls.timeStart,
        timeEnd: cls.timeEnd,
      }));

      return {
        code: 1000,
        message: 'Class list retrieved successfully',
        classes: classList,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async editClass(body: EditClassDto) {
    try {
      // Giải mã token
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

      const { sub, role } = decodedToken;

      // Kiểm tra vai trò (chỉ giảng viên mới được chỉnh sửa lớp học)
      if (role !== 'LECTURER') {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Kiểm tra thông tin giảng viên
      const lecturer = await this.prismaService.lecturer.findUnique({
        where: { userId: sub },
      });
      if (!lecturer) {
        throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra lớp học
      const existingClass = await this.prismaService.class.findUnique({
        where: { id: body.classId },
        include: {
          sessions: true, // Lấy thông tin các buổi học của lớp
        },
      });

      if (!existingClass) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra lớp học có thuộc về giảng viên này không
      if (existingClass.lecturerId !== lecturer.id) {
        throw new HttpException(
          'Class does not belong to this lecturer',
          HttpStatus.FORBIDDEN,
        );
      }

      const type = body.type as unknown as ClassType;

      // Cập nhật lớp học
      const updatedClass = await this.prismaService.class.update({
        where: { id: body.classId },
        data: {
          name: body.className || existingClass.name,
          description: body.description || existingClass.description,
          maxStudents: body.maxStudent || existingClass.maxStudents,
          type: type || existingClass.type,
          semester: body.semester || existingClass.semester,
          timeStart: body.timeStart
            ? new Date(body.timeStart)
            : existingClass.timeStart,
          timeEnd: body.timeEnd
            ? new Date(body.timeEnd)
            : existingClass.timeEnd,
          open:
            body.classStatus !== undefined
              ? body.classStatus
              : existingClass.open,
        },
      });

      // Xử lý cập nhật hoặc thêm mới ClassSessions
      if (body.sessions && body.sessions.length > 0) {
        // Xóa các buổi học cũ
        await this.prismaService.classSession.deleteMany({
          where: { classId: body.classId },
        });

        // Thêm các buổi học mới
        const newSessions = body.sessions.map((session) => ({
          classId: body.classId,
          dayOfWeek: session.dayOfWeek,
          startTime: session.startTime,
          endTime: session.endTime,
        }));

        await this.prismaService.classSession.createMany({
          data: newSessions,
        });
      }

      return {
        code: 1000,
        message: 'Class updated successfully',
        class: updatedClass,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteClass(body: DeleteClassDto) {
    try {
      // Giải mã token
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

      const { sub, role } = decodedToken;

      // Kiểm tra vai trò (chỉ giảng viên mới được xóa lớp học)
      if (role !== 'LECTURER') {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Kiểm tra thông tin giảng viên
      const lecturer = await this.prismaService.lecturer.findUnique({
        where: { userId: sub },
      });
      if (!lecturer) {
        throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra lớp học
      const existingClass = await this.prismaService.class.findUnique({
        where: { id: body.classId },
      });
      if (!existingClass) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra lớp học có thuộc về giảng viên này không
      if (existingClass.lecturerId !== lecturer.id) {
        throw new HttpException(
          'Class does not belong to this lecturer',
          HttpStatus.FORBIDDEN,
        );
      }

      // Xóa lớp học
      await this.prismaService.class.delete({
        where: { id: body.classId },
      });

      return {
        code: 1000,
        message: 'Class deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addMember(body: AddMemberDto) {
    try {
      // Giải mã token
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

      const { sub, role } = decodedToken;

      // Kiểm tra trạng thái kích hoạt của tài khoản
      const user = await this.prismaService.user.findUnique({
        where: { id: sub },
      });

      if (!user || !user.active) {
        throw new HttpException(
          'User account is inactive or not found',
          HttpStatus.FORBIDDEN,
        );
      }

      if (role === 'LECTURER') {
        // Kiểm tra xem người dùng có phải là giảng viên không
        const lecturer = await this.prismaService.lecturer.findUnique({
          where: { userId: sub },
        });

        if (!lecturer) {
          throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
        }

        // Kiểm tra lớp học có thuộc về giảng viên này không
        const existingClass = await this.prismaService.class.findUnique({
          where: { id: body.classId },
          include: { lecturer: true, students: true },
        });

        if (!existingClass || existingClass.lecturerId !== lecturer.id) {
          throw new HttpException(
            'Class not found or does not belong to this lecturer',
            HttpStatus.NOT_FOUND,
          );
        }

        if (!existingClass.open) {
          throw new HttpException('Class is closed', HttpStatus.FORBIDDEN);
        }

        // Kiểm tra sinh viên
        const studentUser = await this.prismaService.user.findUnique({
          where: { id: body.userId },
        });

        if (!studentUser || studentUser.role !== 'STUDENT') {
          throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
        }

        if (!studentUser.active) {
          throw new HttpException(
            'Student account is inactive',
            HttpStatus.FORBIDDEN,
          );
        }

        const student = await this.prismaService.student.findUnique({
          where: { userId: body.userId },
        });

        if (existingClass.students.some((s) => s.id === student.id)) {
          throw new HttpException(
            'Student is already in the class',
            HttpStatus.CONFLICT,
          );
        }

        // Thêm thành viên vào lớp học
        await this.prismaService.class.update({
          where: { id: body.classId },
          data: {
            students: {
              connect: { id: student.id },
            },
          },
        });
      } else if (role === 'STUDENT') {
        // Kiểm tra xem người dùng có quyền truy cập vào lớp học của mình không
        const studentUser = await this.prismaService.user.findUnique({
          where: { id: body.userId },
        });

        if (!studentUser || studentUser.role !== 'STUDENT') {
          throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
        }

        if (sub !== studentUser.id) {
          throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
        }

        // Kiểm tra lớp học tồn tại
        const existingClass = await this.prismaService.class.findUnique({
          where: { id: body.classId },
          include: { students: true },
        });

        if (!existingClass) {
          throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
        }

        if (!existingClass.open) {
          throw new HttpException('Class is closed', HttpStatus.FORBIDDEN);
        }

        const student = await this.prismaService.student.findUnique({
          where: { userId: studentUser.id },
        });

        if (existingClass.students.some((s) => s.id === student.id)) {
          throw new HttpException(
            'Student is already in the class',
            HttpStatus.CONFLICT,
          );
        }

        // Thêm sinh viên vào lớp học
        await this.prismaService.class.update({
          where: { id: body.classId },
          data: {
            students: {
              connect: { id: student.id },
            },
          },
        });
      } else {
        throw new HttpException('Invalid role', HttpStatus.FORBIDDEN);
      }

      return {
        code: 1000,
        message: 'Member added to class successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getClassInfo(body: GetClassInfoDto) {
    try {
      // Giải mã token
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

      const { sub, role } = decodedToken;

      // Kiểm tra trạng thái kích hoạt của tài khoản
      const user = await this.prismaService.user.findUnique({
        where: { id: sub },
      });

      if (!user || !user.active) {
        throw new HttpException(
          'User account is inactive or not found',
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

      // Kiểm tra lớp học
      const existingClass = await this.prismaService.class.findUnique({
        where: { id: classId },
        include: {
          sessions: true,
          lecturer: {
            include: {
              user: true, // Bao gồm thông tin người dùng của giảng viên
            },
          },
          students: true,
        },
      });

      if (!existingClass) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra quyền truy cập
      if (role === 'LECTURER') {
        const lecturer = await this.prismaService.lecturer.findUnique({
          where: { userId: sub },
        });

        if (!lecturer || existingClass.lecturerId !== lecturer.id) {
          throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
        }
      } else if (role === 'STUDENT') {
        const student = await this.prismaService.student.findUnique({
          where: { userId: sub },
        });

        if (
          !student ||
          !existingClass.students.some((s) => s.id === student.id)
        ) {
          throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('Invalid role', HttpStatus.FORBIDDEN);
      }

      // Trả về thông tin lớp học
      return {
        code: 1000,
        message: 'Class info retrieved successfully',
        class: {
          id: existingClass.id,
          name: existingClass.name,
          type: existingClass.type,
          semester: existingClass.semester,
          description: existingClass.description,
          schedule: existingClass.sessions.map(
            (session) =>
              `${session.dayOfWeek}-${session.startTime}-${session.endTime}`,
          ),
          lecturerName: existingClass.lecturer?.user?.username || 'Unknown',
          studentIds: existingClass.students.map((student) => student.id),
          status: existingClass.open,
          timeStart: existingClass.timeStart,
          timeEnd: existingClass.timeEnd,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getClassSchedule(body: GetClassScheduleDto) {
    try {
      // Giải mã token
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

      const { sub, role } = decodedToken;

      // Kiểm tra trạng thái kích hoạt của tài khoản
      const user = await this.prismaService.user.findUnique({
        where: { id: sub },
      });

      if (!user || !user.active) {
        throw new HttpException(
          'User account is inactive or not found',
          HttpStatus.FORBIDDEN,
        );
      }

      const classId = parseInt(body.classId, 10);

      if (Number.isNaN(classId)) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra lớp học
      const existingClass = await this.prismaService.class.findUnique({
        where: { id: classId },
        include: {
          sessions: true,
          students: true,
        },
      });

      if (!existingClass) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra quyền truy cập
      if (role === 'LECTURER') {
        const lecturer = await this.prismaService.lecturer.findUnique({
          where: { userId: sub },
        });

        if (!lecturer || existingClass.lecturerId !== lecturer.id) {
          throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
        }
      } else if (role === 'STUDENT') {
        const student = await this.prismaService.student.findUnique({
          where: { userId: sub },
        });

        if (
          !student ||
          !existingClass.students.some((s) => s.id === student.id)
        ) {
          throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('Invalid role', HttpStatus.FORBIDDEN);
      }

      const schedule = [];
      const startDate = new Date(existingClass.timeStart);
      const endDate = new Date(existingClass.timeEnd);

      const dayMapping = [
        'Chu nhat',
        'Thu 2',
        'Thu 3',
        'Thu 4',
        'Thu 5',
        'Thu 6',
        'Thu 7',
      ];

      for (const session of existingClass.sessions) {
        const sessionDay = Number.isInteger(session.dayOfWeek)
          ? session.dayOfWeek
          : dayMapping.indexOf(session.dayOfWeek);

        if (sessionDay === -1) {
          throw new HttpException(
            `Invalid dayOfWeek format for session: ${session.dayOfWeek}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        const currentDate = new Date(startDate);
        // Tìm ngày đầu tiên phù hợp
        while (currentDate.getDay() !== sessionDay) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Thêm các ngày phù hợp vào lịch
        while (currentDate <= endDate) {
          schedule.push(
            `${dayMapping[sessionDay]}_${currentDate.toISOString().split('T')[0]}_${session.startTime}-${session.endTime}`,
          );
          currentDate.setDate(currentDate.getDate() + 7); // Nhảy đến tuần tiếp theo
        }
      }

      return {
        code: 1000,
        message: 'Class schedule retrieved successfully',
        schedule: schedule,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getClassLists(body: GetClassListsDto) {
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

      const { sub: userId } = decodedToken;

      // Kiểm tra trạng thái kích hoạt của tài khoản
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.active) {
        throw new HttpException(
          'User account is inactive or not found',
          HttpStatus.FORBIDDEN,
        );
      }

      if (!user.status) {
        throw new HttpException(
          'User account is blocked',
          HttpStatus.FORBIDDEN,
        );
      }

      const openClasses = await this.prismaService.class.findMany({
        where: { open: true },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      return {
        code: 1000,
        message: 'Open classes retrieved successfully',
        classes: openClasses,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
