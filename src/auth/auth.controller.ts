/* eslint-disable prettier/prettier */
import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangeInfoAfterSigninDto, GetVerifyCodeDto, LoginDto, RegisterDto, VerifyCodeDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @Post('change-info-after-signin')
  @UseInterceptors(FileInterceptor('file')) // Xử lý file từ FormData
  async editMaterial(
    @Body() body: ChangeInfoAfterSigninDto, // Lấy thông tin JSON
    @UploadedFile() file: Express.Multer.File, // Xử lý file từ FormData
  ) {
    return this.authService.changeInfoAfterSignIn(body, file);
  }
}
