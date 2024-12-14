/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AddMemberDto,
  CreateClassDto,
  DeleteClassDto,
  EditClassDto,
  GetClassInfoDto,
  GetClassListDto,
} from './dto/class.dto';
import { ClassType } from '@prisma/client';

@Injectable()
export class ClassService {
  prisma: any;
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async createClass(body: CreateClassDto) {
    try {
      // Giải mã token
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(body.token, { secret: process.env.JWT_SECRET });
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
            schedule: [],
            type: type,
            semester: body.semester,
            timeStart: new Date(body.timeStart),
            timeEnd: new Date(body.timeEnd),
          },
        });
        return { 
          code: 1000,
          message: 'Class created successfully', 
          class: newClass.id 
        };
      } catch (error) {
        throw new Error(error + 'Failed to create class');  // ném ra lỗi để thông báo
      }
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getClassList(body: GetClassListDto) {
    try {
      // Giải mã token
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(body.token, { secret: process.env.JWT_SECRET });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
        }
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const { sub, role } = decodedToken;

      if ( sub !== body.userId || role !== body.role) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Kiểm tra trạng thái kích hoạt của tài khoản
      const user = await this.prismaService.user.findUnique({
        where: { id: sub },
      });

      if (!user || !user.active) {
        throw new HttpException('User account is inactive or not found', HttpStatus.FORBIDDEN);
      }

      let classes;
    if (role === 'LECTURER') {
        // Lấy danh sách lớp học của giảng viên
        classes = await this.prismaService.class.findMany({
            where: { lecturerId: sub },
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
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async editClass(body: EditClassDto) {
    try {
      // Giải mã token
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(body.token, { secret: process.env.JWT_SECRET });
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
      });
      if (!existingClass) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra lớp học có thuộc về giảng viên này không
      if (existingClass.lecturerId !== lecturer.id) {
        throw new HttpException('Class does not belong to this lecturer', HttpStatus.FORBIDDEN);
      }
      const type = body.type as unknown as ClassType;

      // Cập nhật lớp học
      const updatedClass = await this.prismaService.class.update({
        where: { id: body.classId },
        data: {
          name: body.className || existingClass.name,
          description: body.description || existingClass.description,
          maxStudents: body.maxStudent || existingClass.maxStudents,
          schedule: body.schedule || existingClass.schedule,
          type: type || existingClass.type,
          semester: body.semester || existingClass.semester,
          timeStart: body.timeStart ? new Date(body.timeStart) : existingClass.timeStart,
          timeEnd: body.timeEnd ? new Date(body.timeEnd) : existingClass.timeEnd,
          open: body.classStatus || existingClass.open,
        },
      });

      return {
        code: 1000,
        message: 'Class updated successfully',
        class: updatedClass,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteClass(body: DeleteClassDto) {
    try {
      // Giải mã token
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(body.token, { secret: process.env.JWT_SECRET });
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
        throw new HttpException('Class does not belong to this lecturer', HttpStatus.FORBIDDEN);
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
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addMember(body: AddMemberDto) {
    try {
        // Giải mã token
        let decodedToken;
        try {
            decodedToken = this.jwtService.verify(body.token, { secret: process.env.JWT_SECRET });
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
            throw new HttpException('User account is inactive or not found', HttpStatus.FORBIDDEN);
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
                throw new HttpException('Class not found or does not belong to this lecturer', HttpStatus.NOT_FOUND);
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
                throw new HttpException('Student account is inactive', HttpStatus.FORBIDDEN);
            }

            const student = await this.prismaService.student.findUnique({
                where: { userId: body.userId },
            });

            if (existingClass.students.some(s => s.id === student.id)) {
                throw new HttpException('Student is already in the class', HttpStatus.CONFLICT);
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

            if (existingClass.students.some(s => s.id === student.id)) {
                throw new HttpException('Student is already in the class', HttpStatus.CONFLICT);
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
        throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

  async getClassInfo(getClassInfo: GetClassInfoDto) {
    return getClassInfo;
  }

  async getClassSchedule(token: string) {
    return token;
  }
}
