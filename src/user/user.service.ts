import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import {
  ChangePasswordDto,
  DeactivateUserDto,
  GetUserInfoDto,
  ReactivateUserDto,
  SetUserInfoDto,
  SetUserRoleDto,
} from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private uploadService: UploadService,
  ) {}
  async getUserInfo(body: GetUserInfoDto) {
    // Giải mã token
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

      let userId = decodedToken.sub;

      // Lấy thông tin user
      if (body.userId) {
        userId = parseInt(body.userId, 10);
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return {
        code: 1000,
        message: 'Success',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isActive: user.active,
          phone: user.phone,
          address: user.address,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Ném lại lỗi để trả đúng HttpException
      }
      throw new HttpException(
        'Failed to get user info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async setUserInfo(body: SetUserInfoDto, file: Express.Multer.File) {
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

      const { sub } = decodedToken;
      const userId = parseInt(sub, 10);

      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      // Khởi tạo đối tượng `data` để lưu dữ liệu cần cập nhật
      const data: any = {};

      // Kiểm tra từng trường dữ liệu mới và so sánh với dữ liệu cũ
      if (body.userName && body.userName !== user.username) {
        data.username = body.userName;
      }

      if (body.phone && body.phone !== user.phone) {
        data.phone = body.phone;
      }

      if (body.address && body.address !== user.address) {
        data.address = body.address;
      }

      // Nếu có file thì upload và cập nhật
      if (file) {
        const fileName = await this.uploadService.uploadFile(file);
        const fileUrl = this.uploadService.getFileUrl(fileName);
        data.avatar = fileUrl;
      } else {
        data.avatar = user.avatar; // Giữ nguyên avatar nếu không có file mới
      }

      // Nếu không có trường nào thay đổi, không thực hiện cập nhật
      if (Object.keys(data).length === 0) {
        throw new HttpException(
          'No updates provided or all values are the same as before',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Cập nhật thông tin người dùng trong database
      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data,
      });

      return {
        message: 'User updated successfully',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          isActive: updatedUser.active,
          phone: updatedUser.phone,
          address: updatedUser.address,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Ném lại lỗi để trả đúng HttpException
      }
      throw new HttpException(
        'Failed to update user info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async changePassword(body: ChangePasswordDto) {
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
      const { sub } = decodedToken;
      const userId = parseInt(sub, 10);

      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      await this.prismaService.user.update({
        where: { id: userId },
        data: { password: body.newPassword },
      });

      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Ném lại lỗi để trả đúng HttpException
      }
      throw new HttpException(
        'Failed to change password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async setUserRole(body: SetUserRoleDto) {
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

      const { sub } = decodedToken;

      const user = await this.prismaService.user.findUnique({
        where: { id: sub },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (!user.active) {
        throw new HttpException(
          'Người dùng chưa xác thực',
          HttpStatus.FORBIDDEN,
        );
      }

      if (!user.status) {
        throw new HttpException('Người dùng đã bị khoá', HttpStatus.FORBIDDEN);
      }

      if (user.role !== 'LECTURER') {
        throw new HttpException('Permission denied', HttpStatus.FORBIDDEN);
      }
      const userId = parseInt(body.userId, 10);

      const userToUpdate = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!userToUpdate) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (!userToUpdate.active) {
        throw new HttpException('User is deactivated', HttpStatus.FORBIDDEN);
      }

      await this.prismaService.user.update({
        where: { id: userId },
        data: { role: body.role },
      });
      return {
        message: 'User role updated successfully',
        data: {
          id: userToUpdate.id,
          role: body.role,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Ném lại lỗi để trả đúng HttpException
      }
      throw new HttpException(
        'Failed to set user role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async deactivateUser(body: DeactivateUserDto) {
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

      const { sub } = decodedToken;

      const user = await this.prismaService.user.findUnique({
        where: { id: sub },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (user.role !== 'LECTURER') {
        throw new HttpException('Permission denied', HttpStatus.FORBIDDEN);
      }
      const userId = parseInt(body.userId, 10);

      const userToUpdate = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!userToUpdate) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (!userToUpdate.status) {
        throw new HttpException(
          'User is already deactivated',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prismaService.user.update({
        where: { id: userId },
        data: { status: false },
      });
      return {
        message: 'User role updated successfully',
        data: {
          id: userToUpdate.id,
          email: userToUpdate.email,
          username: userToUpdate.username,
          status: userToUpdate.status ? 'BI_KHOA' : 'BINH_THUONG',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Ném lại lỗi để trả đúng HttpException
      }
      throw new HttpException(
        'Failed to deactivate user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async reactivateUser(body: ReactivateUserDto) {
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

      const { sub } = decodedToken;

      const user = await this.prismaService.user.findUnique({
        where: { id: sub },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (user.role !== 'LECTURER') {
        throw new HttpException('Permission denied', HttpStatus.FORBIDDEN);
      }
      const userId = parseInt(body.userId, 10);

      const userToUpdate = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!userToUpdate) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (userToUpdate.status) {
        throw new HttpException(
          'User is already reactivated',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prismaService.user.update({
        where: { id: userId },
        data: { status: true },
      });
      return {
        message: 'User status updated successfully',
        data: {
          id: userToUpdate.id,
          email: userToUpdate.email,
          username: userToUpdate.username,
          status: userToUpdate.status ? 'BI_KHOA' : 'BINH_THUONG',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Ném lại lỗi để trả đúng HttpException
      }
      throw new HttpException(
        'Failed to reactivate user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
