/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateAssingmentDto,
  DeleteAssingmentDto,
  GetAssignmentInfoDto,
  GetAssignmentListDto,
  GradeAssignmentDto,
  SubmitAssignmentDto,
  UpdateAssingmentDto,
} from './dto/assignment.dto';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class AssignmentService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private uploadService: UploadService,
  ) {}

  async createAssignment(body: CreateAssingmentDto, file: Express.Multer.File) {
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
          'Only lecturer can create assignment',
          HttpStatus.UNAUTHORIZED,
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
        },
      });

      if (!lecturerClass) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      if (lecturerClass.lecturerId !== lecturer.id) {
        throw new HttpException(
          'You are not the lecturer of this class',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (!file && !body.description) {
        throw new HttpException(
          'No file and description ',
          HttpStatus.BAD_REQUEST,
        );
      }
      let fileUrl = '';
      if (file) {
        // Upload file
        const fileName = await this.uploadService.uploadFile(file);
        fileUrl = this.uploadService.getFileUrl(fileName);
      }

      let description = '';
      if (body.description) {
        description = body.description;
      }
      const dueDate = body.dueDate
        ? new Date(body.dueDate)
        : new Date('9999-12-31');

      const assignment = await this.prismaService.assignment.create({
        data: {
          title: body.title,
          description: description,
          link: fileUrl,
          dueDate: dueDate,
          class: { connect: { id: classId } },
          lecturer: { connect: { id: lecturer.id } },
        },
      });
      return {
        code: 1000,
        message: 'Create assignment successfully',
        data: assignment,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  async updateAssignment(body: UpdateAssingmentDto, file: Express.Multer.File) {
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
          'Only lecturer can update assignment',
          HttpStatus.UNAUTHORIZED,
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

      const assignmentId = parseInt(body.assignmentId, 10);

      if (Number.isNaN(assignmentId)) {
        throw new HttpException(
          'Khong tim thay nhien vu nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const assignment = await this.prismaService.assignment.findUnique({
        where: {
          id: assignmentId,
        },
        include: {
          class: true,
        },
      });

      if (!assignment) {
        throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
      }

      if (assignment.lecturerId !== lecturer.id) {
        throw new HttpException(
          'You are not the lecturer of this assignment',
          HttpStatus.UNAUTHORIZED,
        );
      }

      let fileUrl = assignment.link;
      if (file) {
        // Upload new file
        const fileName = await this.uploadService.uploadFile(file);
        fileUrl = this.uploadService.getFileUrl(fileName);
      }

      const updatedAssignment = await this.prismaService.assignment.update({
        where: {
          id: assignmentId,
        },
        data: {
          title: body.title || assignment.title,
          description: body.description || assignment.description,
          link: fileUrl,
          dueDate: body.dueDate ? new Date(body.dueDate) : assignment.dueDate,
        },
      });

      return {
        code: 1000,
        message: 'Update assignment successfully',
        data: updatedAssignment,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  async deleteAssignment(body: DeleteAssingmentDto) {
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
          'Only lecturer can delete assignment',
          HttpStatus.UNAUTHORIZED,
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

      const assignmentId = parseInt(body.assignmentId, 10);

      if (Number.isNaN(assignmentId)) {
        throw new HttpException(
          'Khong tim thay nhiem vu nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const assignment = await this.prismaService.assignment.findUnique({
        where: {
          id: assignmentId,
        },
      });

      if (!assignment) {
        throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
      }

      if (assignment.lecturerId !== lecturer.id) {
        throw new HttpException(
          'You are not the lecturer of this assignment',
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.prismaService.assignment.delete({
        where: {
          id: assignmentId,
        },
      });

      return {
        code: 1000,
        message: 'Delete assignment successfully',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  async submitAssignment(body: SubmitAssignmentDto, file: Express.Multer.File) {
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

      if (role !== 'STUDENT') {
        throw new HttpException(
          'Only students can submit assignments',
          HttpStatus.UNAUTHORIZED,
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

      const assignmentId = parseInt(body.assignmentId, 10);

      if (Number.isNaN(assignmentId)) {
        throw new HttpException(
          'Khong tim thay nhiem vu nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const assignment = await this.prismaService.assignment.findUnique({
        where: {
          id: assignmentId,
        },
      });

      if (!assignment) {
        throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
      }

      if (!file && !body.text) {
        throw new HttpException(
          'No file or text provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      let fileUrl = '';
      if (file) {
        // Upload file
        const fileName = await this.uploadService.uploadFile(file);
        fileUrl = this.uploadService.getFileUrl(fileName);
      }

      const existingSubmission =
        await this.prismaService.assignmentSubmission.findFirst({
          where: {
            studentId: student.id,
            assignmentId: assignmentId,
          },
        });

      let submission;
      if (existingSubmission) {
        submission = await this.prismaService.assignmentSubmission.update({
          where: {
            id: existingSubmission.id,
          },
          data: {
            text: body.text || existingSubmission.text,
            link: fileUrl || existingSubmission.link,
          },
        });
      } else {
        submission = await this.prismaService.assignmentSubmission.create({
          data: {
            student: { connect: { id: student.id } },
            assignment: { connect: { id: assignmentId } },
            text: body.text || '',
            link: fileUrl,
          },
        });
      }

      return {
        code: 1000,
        message: existingSubmission
          ? 'Update assignment submission successfully'
          : 'Submit assignment successfully',
        data: submission,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  async gradeAssignment(body: GradeAssignmentDto) {
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
          'Only lecturer can grade assignments',
          HttpStatus.UNAUTHORIZED,
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

      const assignmentId = parseInt(body.assignmentId, 10);
      const assignmentSubmissionId = parseInt(body.assignmentSubmitId, 10);

      if (Number.isNaN(assignmentId)) {
        throw new HttpException(
          'Khong tim thay nhiem vu nay',
          HttpStatus.NOT_FOUND,
        );
      }

      if (Number.isNaN(assignmentSubmissionId)) {
        throw new HttpException(
          'Khong tim thay bai nop nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const assignment = await this.prismaService.assignment.findUnique({
        where: {
          id: assignmentId,
        },
      });

      if (!assignment) {
        throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
      }

      if (assignment.lecturerId !== lecturer.id) {
        throw new HttpException(
          'You are not the lecturer of this assignment',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const assignmentSubmission =
        await this.prismaService.assignmentSubmission.findUnique({
          where: {
            id: assignmentSubmissionId,
          },
        });

      if (!assignmentSubmission) {
        throw new HttpException(
          'Assignment submission not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const grade = parseInt(body.grade, 10);

      if (typeof grade !== 'number') {
        throw new HttpException(
          'Grade must be a number',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (grade < 0 || grade > 10) {
        throw new HttpException(
          'Grade must be between 0 and 10',
          HttpStatus.BAD_REQUEST,
        );
      }

      const gradedSubmission =
        await this.prismaService.assignmentSubmission.update({
          where: {
            id: assignmentSubmissionId,
          },
          data: {
            grade: grade,
          },
        });

      return {
        code: 1000,
        message: 'Grade assignment successfully',
        data: gradedSubmission,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  async getAssignmentList(body: GetAssignmentListDto) {
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

      if (role !== 'LECTURER' && role !== 'STUDENT') {
        throw new HttpException(
          'Only lecturer and student can get assignment list',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const classId = parseInt(body.classId, 10);

      if (Number.isNaN(classId)) {
        throw new HttpException(
          'Khong tim thay lop hoc nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const classInfo = await this.prismaService.class.findUnique({
        where: {
          id: classId,
        },
        include: {
          lecturer: true,
          students: true,
        },
      });

      if (!classInfo) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      if (role === 'LECTURER') {
        const lecturer = await this.prismaService.lecturer.findUnique({
          where: {
            userId: userId,
          },
        });
        if (!lecturer) {
          throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
        }
        if (classInfo.lecturerId !== lecturer.id) {
          throw new HttpException(
            'You are not the lecturer of this class',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }

      if (role === 'STUDENT') {
        const student = await this.prismaService.student.findUnique({
          where: {
            userId: userId,
          },
        });
        if (!student) {
          throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
        }
        if (
          !classInfo.students.some((student) => student.userId === student.id)
        ) {
          throw new HttpException(
            'You are not a student of this class',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }

      const assignments = await this.prismaService.assignment.findMany({
        where: {
          classId: classId,
        },
      });

      return {
        code: 1000,
        message: 'Get assignment list successfully',
        data: assignments,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  async getAssignmentInfo(body: GetAssignmentInfoDto) {
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

      if (role !== 'LECTURER' && role !== 'STUDENT') {
        throw new HttpException(
          'Only lecturer and student can get assignment info',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const assignmentId = parseInt(body.assignmentId, 10);

      if (Number.isNaN(assignmentId)) {
        throw new HttpException(
          'Khong tim thay nhiem vu nay',
          HttpStatus.NOT_FOUND,
        );
      }

      const assignment = await this.prismaService.assignment.findUnique({
        where: {
          id: assignmentId,
        },
        include: {
          class: {
            include: {
              lecturer: true,
              students: true,
            },
          },
        },
      });

      if (!assignment) {
        throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
      }

      if (role === 'LECTURER') {
        const lecturer = await this.prismaService.lecturer.findUnique({
          where: {
            userId: userId,
          },
        });
        if (!lecturer) {
          throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
        }
        if (assignment.class.lecturerId !== lecturer.id) {
          throw new HttpException(
            'You are not the lecturer of this class',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }

      if (role === 'STUDENT') {
        const student = await this.prismaService.student.findUnique({
          where: {
            userId: userId,
          },
        });
        if (!student) {
          throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
        }
        if (
          !assignment.class.students.some(
            (student) => student.userId === userId,
          )
        ) {
          throw new HttpException(
            'You are not a student of this class',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }

      return {
        code: 1000,
        message: 'Get assignment info successfully',
        data: {
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          link: assignment.link,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
