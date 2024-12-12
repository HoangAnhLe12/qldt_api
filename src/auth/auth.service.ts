/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, LogoutDto, RegisterDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
    // Tạo tài khoản
    const user = await this.prismaService.user.create({
      data: {
        email,
        password,
        role,
        username: '',
        avatar: '',
      },
    });
    return {
      status: 1000,
      message: 'Register successfully',
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

    const passwordMatched = loginDto.password === user.password;
    if (!passwordMatched) {
      throw new ForbiddenException('Invalid email or password');
    }

    return {
      status: 1000,
      message: 'Login successfully',
      data: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        active: user.active,
        accessToken: (await this.signJwtToken(user.id, user.email, user.role))
          .accessToken,
      },
    };
  }

  async logout(token: LogoutDto) {
    try {
      const decodedToken = this.jwtService.verify(token.token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
