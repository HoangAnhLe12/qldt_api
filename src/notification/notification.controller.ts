import { Body, Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  GetNotificationDto,
  MarkNotificationDto,
  SendNotificationDto,
} from './dto/notification.dto';

@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post('send-notification')
  sendNotification(@Body() body: SendNotificationDto) {
    return this.notificationService.sendNotification(body);
  }
  @Post('get-notification')
  getNotification(@Body() body: GetNotificationDto) {
    return this.notificationService.getNotification(body);
  }
  @Post('mark-notification')
  markNotification(@Body() body: MarkNotificationDto) {
    return this.notificationService.markNotification(body);
  }
}
