/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [JwtModule, UploadModule],
  controllers: [ConversationController],
  providers: [ConversationService],
})
export class ConversationModule {}
