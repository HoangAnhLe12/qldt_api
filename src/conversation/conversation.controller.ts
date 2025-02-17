/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import {
  BlockUserDto,
  DeleteMessageDto,
  GetConversationDto,
  GetMessageListDto,
  MarkMessageReadDto,
  SendMessageDto,
  UpdateMessageDto,
} from './dto/conversation.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('conversation')
export class ConversationController {
  constructor(private conversationService: ConversationService) {}
  @Post('send-message')
  @UseInterceptors(FileInterceptor('file'))
  async sendMessage(
    @Body() body: SendMessageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.conversationService.sendMessage(body, file);
  }
  @Post('get-conversation')
  async getConversation(@Body() body: GetConversationDto) {
    return this.conversationService.getConversation(body);
  }
  @Post('get-message-list')
  async getMessageList(@Body() body: GetMessageListDto) {
    return this.conversationService.getMessageList(body);
  }
  @Post('mark-message-read')
  async markMessageRead(@Body() body: MarkMessageReadDto) {
    return this.conversationService.markMessageRead(body);
  }
  @Post('delete-message')
  async deleteMessage(@Body() body: DeleteMessageDto) {
    return this.conversationService.deleteMessage(body);
  }
  @Post('update-message')
  async updateMessage(@Body() body: UpdateMessageDto) {
    return this.conversationService.updateMessage(body);
  }
  @Post('block-user')
  async blockUser(@Body() body: BlockUserDto) {
    return this.conversationService.blockUser(body);
  }
}
