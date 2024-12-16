import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  GetNotificationDto,
  MarkNotificationDto,
  SendNotificationDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async sendNotification(body: SendNotificationDto) {
    try {
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(body.token, {
          secret: process.env.JWT_SECRET,
        });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
        }
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const { sub, role } = decodedToken;

      if (role !== 'LECTURER') {
        throw new HttpException(
          'You are not authorized to send notification',
          HttpStatus.FORBIDDEN,
        );
      }

      const lecturer = await this.prismaService.lecturer.findUnique({
        where: {
          userId: sub,
        },
      });

      if (!lecturer) {
        throw new HttpException('Lecturer not found', HttpStatus.NOT_FOUND);
      }

      const userId = parseInt(body.userId, 10);

      if (Number.isNaN(userId)) {
        throw new HttpException('User is not found', HttpStatus.NOT_FOUND);
      }

      const student = await this.prismaService.student.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!student) {
        throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
      }

      const notification = await this.prismaService.notification.create({
        data: {
          type: body.type,
          message: body.message,
          relatedId: body.relatedId ? parseInt(body.relatedId, 10) : null,
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });
      return {
        code: 1000,
        message: 'Notification sent successfully',
        data: notification,
        HttpStatus: HttpStatus.OK,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getNotification(body: GetNotificationDto) {
    try {
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(body.token, {
          secret: process.env.JWT_SECRET,
        });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
        }
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const { sub: userId } = decodedToken;

      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const notifications = await this.prismaService.notification.findMany({
        where: {
          userId: userId,
        },
        skip: body.index,
        take: body.count,
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (!notifications.length) {
        throw new HttpException('No notification found', HttpStatus.NOT_FOUND);
      }

      return {
        code: 1000,
        message: 'Notification retrieved successfully',
        data: notifications,
        HttpStatus: HttpStatus.OK,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async markNotification(body: MarkNotificationDto) {
    try {
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(body.token, {
          secret: process.env.JWT_SECRET,
        });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
        }
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const { sub: userId } = decodedToken;

      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      for (const notificationId of body.notificationIds) {
        const notification = await this.prismaService.notification.findUnique({
          where: {
            id: notificationId,
          },
        });

        if (!notification) {
          throw new HttpException(
            `Notification with id ${notificationId} not found`,
            HttpStatus.NOT_FOUND,
          );
        }

        if (notification.userId !== userId) {
          throw new HttpException(
            `Notification with id ${notificationId} does not belong to the user`,
            HttpStatus.FORBIDDEN,
          );
        }

        await this.prismaService.notification.update({
          where: {
            id: notificationId,
          },
          data: {
            read: true,
          },
        });
      }

      return {
        code: 1000,
        message: 'Notifications marked as read successfully',
        HttpStatus: HttpStatus.OK,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
