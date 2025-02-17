/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [JwtModule, UploadModule],
  providers: [MaterialService],
  controllers: [MaterialController],
})
export class MaterialModule {}
