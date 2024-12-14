/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { createMaterialDto, deleteMaterialDto, editMaterialDto, getMaterialInfoDto, getMaterialListDto } from './dto/material.dto';
import { UploadService } from 'src/upload/upload.service';
import { MaterialType } from '@prisma/client';

@Injectable()
export class MaterialService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private uploadService: UploadService,
  ) {}
  async uploadStudyMaterial(
    body: createMaterialDto,
    file: Express.Multer.File,
  ) {
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

      const userId = parseInt(body.userId, 10); 
      const classId = parseInt(body.classId, 10); 
      
      if (role !== 'LECTURER' || sub !== userId) {
        throw new HttpException(
          'You are not authorized to upload study material',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const lecturer = await this.prismaService.lecturer.findUnique({
        where: { userId: userId },
    });

    if (!lecturer) {
        throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra lớp học có thuộc về giảng viên này không
    const existingClass = await this.prismaService.class.findUnique({
        where: { id: classId },
        include: { lecturer: true },
    });

    if (!existingClass || existingClass.lecturerId !== lecturer.id) {
        throw new HttpException('Class not found or does not belong to this lecturer', HttpStatus.NOT_FOUND);
    }

      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Upload file
      const fileName = await this.uploadService.uploadFile(file);
      const fileUrl = this.uploadService.getFileUrl(fileName);

      const type = body.type as MaterialType;

      // Lưu thông tin tài liệu vào database
      const material = await this.prismaService.studyMaterial.create({
        data: {
          classId: classId,
          title: body.title,
          description: body.description,
          link: fileUrl,
          type: type,
        },
      });

      return {
        message: 'Study material uploaded and saved successfully',
        material,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async editMaterial(body: editMaterialDto, file: Express.Multer.File) {
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

      const { sub, role } = decodedToken;
      const materialId = parseInt(body.materialId, 10);

      if (role !== 'LECTURER') {
        throw new HttpException(
          'You are not authorized to edit study material',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const material = await this.prismaService.studyMaterial.findUnique({
        where: { id: materialId },
        include: { class: { include: { lecturer: true } } },
      });

      if (!material) {
        throw new HttpException('Material not found', HttpStatus.NOT_FOUND);
      }

      if (material.class.lecturer.userId !== sub) {
        throw new HttpException('Not authorized to edit this material', HttpStatus.FORBIDDEN);
      }

      let fileUrl = material.link;
      if (file) {
        const fileName = await this.uploadService.uploadFile(file);
        fileUrl = this.uploadService.getFileUrl(fileName);
      }

      const type = body.type as MaterialType;

      const updateData: any = {};
      if (body.title && body.title !== material.title) {
        updateData.title = body.title;
      }
      if (body.description && body.description !== material.description) {
        updateData.description = body.description;
      }
      if (fileUrl !== material.link) {
        updateData.link = fileUrl;
      }
      if (type && type !== material.type) {
        updateData.type = type;
      }

      const updatedMaterial = await this.prismaService.studyMaterial.update({
        where: { id: materialId },
        data: updateData,
      });

      return {
        message: 'Study material updated successfully',
        material: updatedMaterial,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async deleteMaterial(body: deleteMaterialDto) {
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
    const materialId = parseInt(body.materialId, 10);

    if (role !== 'LECTURER') {
      throw new HttpException(
        'You are not authorized to delete study material',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const material = await this.prismaService.studyMaterial.findUnique({
      where: { id: materialId },
      include: { class: { include: { lecturer: true } } },
    });

    if (!material) {
      throw new HttpException('Material not found', HttpStatus.NOT_FOUND);
    }

    if (material.class.lecturer.userId !== sub) {
      throw new HttpException('Not authorized to delete this material', HttpStatus.FORBIDDEN);
    }

    await this.prismaService.studyMaterial.delete({
      where: { id: materialId },
    });

    return {
      message: 'Study material deleted successfully',
    };
  }

  async getMaterialList(body: getMaterialListDto) {
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
  
      const { sub, role } = decodedToken;
  
      // Kiểm tra nếu người dùng là giảng viên
      if (role === 'LECTURER') {
        const lecturer = await this.prismaService.lecturer.findUnique({
          where: { userId: sub },
        });
  
        if (!lecturer) {
          throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
        }
  
        const existingClass = await this.prismaService.class.findUnique({
          where: { id: parseInt(body.classId, 10) },
          include: { lecturer: true },
        });
  
        if (!existingClass || existingClass.lecturerId !== lecturer.id) {
          throw new HttpException('Class not found or lecturer is not assigned to this class', HttpStatus.NOT_FOUND);
        }
  
        // Nếu là giảng viên, cho phép xem tài liệu của lớp này
      } else if (role === 'STUDENT') {
        // Kiểm tra nếu người dùng là sinh viên
        const student = await this.prismaService.student.findUnique({
          where: { userId: sub },
        });
  
        if (!student) {
          throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
        }
  
        const existingClass = await this.prismaService.class.findUnique({
          where: { id: parseInt(body.classId, 10) },
          include: { students: true },
        });
  
        if (!existingClass) {
          throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
        }
  
        // Kiểm tra sinh viên có trong danh sách lớp không
        if (!existingClass.students.some(s => s.userId === sub)) {
          throw new HttpException('Student not enrolled in this class', HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('Invalid role', HttpStatus.FORBIDDEN);
      }
  
      // Truy xuất tài liệu học tập của lớp
      const materials = await this.prismaService.studyMaterial.findMany({
        where: { classId: parseInt(body.classId, 10) },
      });
  
      if (!materials || materials.length === 0) {
        throw new HttpException('No materials found for this class', HttpStatus.NOT_FOUND);
      }
  
      return {
        message: 'Materials retrieved successfully',
        materials,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getMaterialInfo(body: getMaterialInfoDto) {
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

      const { sub, role } = decodedToken;
      const materialId = parseInt(body.materialId, 10);

      const material = await this.prismaService.studyMaterial.findUnique({
        where: { id: materialId },
        include: { class: { include: { lecturer: true, students: true } } },
      });

      if (!material) {
        throw new HttpException('Material not found', HttpStatus.NOT_FOUND);
      }

      if (role === 'LECTURER') {
        const lecturer = await this.prismaService.lecturer.findUnique({
          where: { userId: sub },
        });

        if (!lecturer || material.class.lecturer.userId !== sub) {
          throw new HttpException('Not authorized to view this material', HttpStatus.FORBIDDEN);
        }
      } else if (role === 'STUDENT') {
        const student = await this.prismaService.student.findUnique({
          where: { userId: sub },
        });

        if (!student || !material.class.students.some(s => s.userId === sub)) {
          throw new HttpException('Not authorized to view this material', HttpStatus.FORBIDDEN);
        }
      } else {
        throw new HttpException('Invalid role', HttpStatus.FORBIDDEN);
      }

      return {
        message: 'Material retrieved successfully',
        data: {
          id: material.id,
          title: material.title,
          description: material.description,
          link: material.link,
          type: material.type,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
}
