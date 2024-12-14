/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChangeInfoAfterSigninDto, LoginDto, RegisterDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private uploadService: UploadService,
  ) {}
  async register(registerDto: RegisterDto) {
    const { email, password, role: userRole } = registerDto;
    const role = userRole as unknown as Role;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new HttpException(
        {
          STATUS_CODES: 9996,
          message: 'User existed',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const code = this.generateCode(6);
    // Tạo tài khoản
    const user = await this.prismaService.user.create({
      data: {
        email,
        password,
        role,
        token: '',
        username: '',
        avatar: '',
      },
    });
    // Thêm bản ghi vào bảng phụ thuộc (Lecturer hoặc Student)
    if (role === 'LECTURER') {
      await this.prismaService.lecturer.create({
        data: {
          userId: user.id, // Liên kết với User vừa tạo
        },
      });
    } else {
      await this.prismaService.student.create({
        data: {
          userId: user.id, // Liên kết với User vừa tạo
        },
      });
    }
    await this.prismaService.verificationCode.create({
      data: {
        userId: user.id,
        code: code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Mã hết hạn sau 10 phút
      },
    });
    return {
      status: 1000,
      message: 'Register successfully',
      verifyCode: code,
    };
  }

  async signJwtToken(
    id: number,
    email: string,
    role: string,
  ): Promise<{ accessToken: string }> {
    const payload = {
      sub: id,
      email,
      role,
    };
    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn: '10m',
      secret: this.configService.get('JWT_SECRET'),
    });
    return {
      accessToken: jwtString,
    };
  }

  async getClassesByRole(userId: number, role: string) {
    if (role === 'LECTURER') {
      const lecturer = await this.prismaService.lecturer.findUnique({
        where: { userId },
        include: {
          classes: true, // Lấy danh sách các lớp học
        },
      });
      return lecturer.classes;
    } else {
      const student = await this.prismaService.student.findUnique({
        where: { userId },
        include: {
          classes: true, // Lấy danh sách các lớp học
        },
      });
      if (!student) {
        throw new NotFoundException('Lecturer not found');
      }
      return student.classes;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new HttpException(
        {
          STATUS_CODES: 9995,
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    if (!user.status) {
      throw new HttpException(
        {
          STATUS_CODES: 9996,
          message: 'Người dùng đã bị khoá',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const passwordMatched = loginDto.password === user.password;
    if (!passwordMatched) {
      throw new ForbiddenException('Invalid email or password');
    }
    // Tạo access token
    const { accessToken } = await this.signJwtToken(
      user.id,
      user.email,
      user.role,
    );
    // Cập nhật token cho user
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { token: accessToken }, // Thêm trường accessToken trong bảng user (nếu chưa có)
    });
    const classes = await this.getClassesByRole(user.id, user.role);

    return {
      status: 1000,
      message: 'Login successfully',
      data: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        active: user.active,
        token: accessToken,
        classes: classes,
      },
    };
  }

  async logout(
    token: string,
  ): Promise<{ statusCode: number; message: string }> {
    // Kiểm tra token
    const user = await this.prismaService.user.findFirst({
      where: { token },
    });

    if (!user) {
      throw new BadRequestException('Token không hợp lệ hoặc đã đăng xuất.');
    }

    // Xóa token
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { token: '' },
    });

    return {
      statusCode: 1000,
      message: 'Đăng xuất thành công.',
    };
  }

  async getVerifyCode(email: string) {
    // Kiểm tra người dùng có tồn tại không
    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (!user) {
      throw new HttpException(
        {
          STATUS_CODES: 9995,
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if(!user.status){
      throw new HttpException(
        {
          STATUS_CODES: 9996,
          message: 'Tài khoản đã bị khoá.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Tạo mã xác thực (6 ký tự, gồm chữ và số)
    const code = this.generateCode(6);

    // Lưu mã xác thực vào bảng VerificationCode
    await this.prismaService.verificationCode.create({
      data: {
        userId: user.id,
        code: code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Mã hết hạn sau 10 phút
      },
    });

    return {
      statusCode: 1000,
      message: 'OK',
      verificationCode: code, // Nếu cần gửi mã về client
    };
  }

  private generateCode(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }

  async verifyUserCode(email: string, code: string) {
    // Tìm user dựa trên email
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpException(
        {
          STATUS_CODES: 9995,
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if(!user.status){
      throw new HttpException(
        {
          STATUS_CODES: 9996,
          message: 'Tài khoản đã bị khoá.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.active) {
      throw new HttpException(
        {
          STATUS_CODES: 9996,
          message: 'Tài khoản đã được xác nhận.',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    // Kiểm tra mã xác thực trong bảng VerificationCode
    const verificationCode =
      await this.prismaService.verificationCode.findFirst({
        where: {
          userId: user.id,
          code: code,
          expiresAt: {
            gte: new Date(), // Kiểm tra mã chưa hết hạn
          },
          used: false, // Mã chưa được sử dụng
        },
      });

    if (!verificationCode) {
      throw new BadRequestException(
        'Mã xác thực không hợp lệ hoặc đã hết hạn.',
      );
    }

    // Đánh dấu mã xác thực là đã sử dụng
    await this.prismaService.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    // Xóa tất cả các mã xác thực khác của người dùng này, ngoại trừ mã vừa xác thực
    await this.prismaService.verificationCode.deleteMany({
      where: {
        userId: user.id,
        id: {
          not: verificationCode.id, // Giữ lại mã vừa được xác thực
        },
      },
    });

    // Cập nhật tài khoản là active nếu chưa active
    if (!user.active) {
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { active: true },
      });
    }

    return {
      id: user.id,
      active: true,
      message: 'Xác nhận thành công.',
    };
  }
  
  async changeInfoAfterSignIn(body: ChangeInfoAfterSigninDto,file: Express.Multer.File,) {
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

      const { sub} = decodedToken;

      const user = await this.prismaService.user.findUnique({
        where: { id: sub },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if(!user.status){
        throw new HttpException(
          {
            STATUS_CODES: 9996,
            message: 'Tài khoản đã bị khoá.',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      let fileUrl;
      let username;

      if(body.userName !== user.username){
        username = body.userName;
      } else {
        username = user.username;
      }
      if (file) {
        // Upload file
        const fileName = await this.uploadService.uploadFile(file);
        fileUrl = this.uploadService.getFileUrl(fileName);
      } else {
       fileUrl = user.avatar;
      }

    // Cập nhật thông tin người dùng
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        avatar: fileUrl,
        username: username,
      },
    });

    return {
      statusCode: 1000,
      message: 'Cập nhật thông tin thành công.',
    };
  }
  catch (error) {
    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  }
}
}
