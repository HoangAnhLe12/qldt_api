import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto, RegisterDto } from './dto';

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
  loout(@Body('token') token: LogoutDto) {
    return this.authService.logout(token);
  }
}
