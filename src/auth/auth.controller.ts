/* eslint-disable prettier/prettier */
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GetVerifyCodeDto, LoginDto, RegisterDto, VerifyCodeDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('logout')
  logout(@Body('token') token: string) {
    return this.authService.logout(token);
  }

  @Post('get-verify-code')
  getVerifyCode(@Body() email: GetVerifyCodeDto) {
    return this.authService.getVerifyCode(email.email);
  }

  @Post('check-verify-code')
  async checkVerifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return await this.authService.verifyUserCode(
      verifyCodeDto.email,
      verifyCodeDto.code,
    );
  }
}
