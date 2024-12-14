/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [JwtModule.register({}), UploadModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
