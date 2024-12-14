import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ChangePasswordDto,
  DeactivateUserDto,
  GetUserInfoDto,
  ReactivateUserDto,
  SetUserInfoDto,
  SetUserRoleDto,
} from './dto/user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('get-user-info')
  async getUserInfo(@Body() body: GetUserInfoDto) {
    return this.userService.getUserInfo(body);
  }
  @Post('set-user-info')
  @UseInterceptors(FileInterceptor('file')) // Xử lý file từ FormData
  async setUserInfo(
    @Body() body: SetUserInfoDto, // Lấy thông tin JSON
    @UploadedFile() file: Express.Multer.File, // Xử lý file từ FormData
  ) {
    return this.userService.setUserInfo(body, file);
  }
  @Post('change-password')
  async deleteMaterial(@Body() body: ChangePasswordDto) {
    return this.userService.changePassword(body);
  }
  @Post('set-user-role')
  async setUserRole(@Body() body: SetUserRoleDto) {
    return this.userService.setUserRole(body);
  }
  @Post('deactivate-user')
  async deactivateUser(@Body() body: DeactivateUserDto) {
    return this.userService.deactivateUser(body);
  }
  @Post('reactivate-user')
  async reactivateUser(@Body() body: ReactivateUserDto) {
    return this.userService.reactivateUser(body);
  }
}
