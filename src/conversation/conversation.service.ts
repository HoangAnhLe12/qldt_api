import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BlockUserDto,
  DeleteMessageDto,
  GetConversationDto,
  GetMessageListDto,
  MarkMessageReadDto,
  SendMessageDto,
  UpdateMessageDto,
} from './dto/conversation.dto';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class ConversationService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private uploadService: UploadService,
  ) {}

  async sendMessage(body: SendMessageDto, file: Express.Multer.File) {
    try {
      // Giải mã token
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

      const { sub: senderId } = decodedToken;

      // Kiểm tra xem người gửi có tồn tại không
      const sender = await this.prismaService.user.findUnique({
        where: { id: senderId },
      });

      if (!sender) {
        throw new HttpException('Sender not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra xem người nhận có tồn tại không

      const receiverId = parseInt(body.receiverId, 10);

      if (Number.isNaN(receiverId)) {
        throw new HttpException('Receiver not found', HttpStatus.NOT_FOUND);
      }

      const receiver = await this.prismaService.user.findUnique({
        where: { id: receiverId },
      });

      if (!receiver) {
        throw new HttpException('Receiver not found', HttpStatus.NOT_FOUND);
      }

      //Kiểm tra xem tồn tại cuộc trò chuyện giữa 2 người này chưa
      // Nếu chưa thì tạo mới
      let conversation = await this.prismaService.conversation.findFirst({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
      });

      if (!conversation) {
        conversation = await this.prismaService.conversation.create({
          data: {
            senderId,
            receiverId,
          },
        });
      }

      // Kiểm tra trạng thái chặn
      if (conversation.senderId === senderId) {
        // Trường hợp sender đang gửi tin nhắn và bị receiver chặn
        if (conversation.receiverBlocked) {
          throw new HttpException(
            'You have been blocked by the receiver. Cannot send messages.',
            HttpStatus.FORBIDDEN,
          );
        }
      } else if (conversation.receiverId === senderId) {
        // Trường hợp receiver đang gửi tin nhắn và bị sender chặn
        if (conversation.senderBlocked) {
          throw new HttpException(
            'You have blocked the sender. Cannot send messages.',
            HttpStatus.FORBIDDEN,
          );
        }
      } else {
        // Người dùng không thuộc cuộc trò chuyện
        throw new HttpException(
          'You are not a participant in this conversation.',
          HttpStatus.FORBIDDEN,
        );
      }

      // Xử lý file đính kèm
      let fileUrl = null;
      if (file) {
        const fileName = await this.uploadService.uploadFile(file);
        fileUrl = await this.uploadService.getFileUrl(fileName);
      }

      // Tạo tin nhắn
      const message = await this.prismaService.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          content: body.message,
          fileUrl,
        },
      });

      return message;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getConversation(body: GetConversationDto) {
    try {
      // Giải mã token
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

      // Kiểm tra xem người dùng có tồn tại không
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const conversations = await this.prismaService.conversation.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        skip: body.index,
        take: body.count,
        orderBy: { updatedAt: 'desc' },
      });

      if (!conversations || conversations.length === 0) {
        throw new HttpException('No conversation found', HttpStatus.NOT_FOUND);
      }

      return conversations;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getMessageList(body: GetMessageListDto) {
    try {
      // Giải mã token
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

      // Kiểm tra xem người dùng có tồn tại không
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (typeof body.conversationId === 'string') {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra xem cuộc trò chuyện có tồn tại không
      const conversation = await this.prismaService.conversation.findUnique({
        where: { id: body.conversationId },
      });

      if (
        conversation.senderId !== userId &&
        conversation.receiverId !== userId
      ) {
        throw new HttpException(
          'You are not in the conversation',
          HttpStatus.NOT_FOUND,
        );
      }

      if (!conversation) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }

      const messages = await this.prismaService.message.findMany({
        where: { conversationId: body.conversationId },
        skip: body.index,
        take: body.count,
        orderBy: { createdAt: 'asc' },
      });

      if (!messages || messages.length === 0) {
        throw new HttpException('No message found', HttpStatus.NOT_FOUND);
      }

      return messages;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async markMessageRead(body: MarkMessageReadDto) {
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
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const conversationId = parseInt(body.conversationId, 10);

      if (Number.isNaN(conversationId)) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }

      const conversation = await this.prismaService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }

      if (
        conversation.senderId !== userId &&
        conversation.receiverId !== userId
      ) {
        throw new HttpException(
          'You are not in the conversation',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prismaService.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          read: false,
        },
        data: { read: true },
      });

      return {
        code: 1000,
        message: 'Marked as read',
        HttpStatus: HttpStatus.OK,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async updateMessage(body: UpdateMessageDto) {
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
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const messageId = parseInt(body.messageId, 10);

      if (Number.isNaN(messageId)) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }

      const message = await this.prismaService.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }

      if (message.senderId !== userId) {
        throw new HttpException(
          'You are not the sender of this message',
          HttpStatus.FORBIDDEN,
        );
      }

      const updatedMessage = await this.prismaService.message.update({
        where: { id: messageId },
        data: { content: body.newMessage },
      });

      return updatedMessage;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async deleteMessage(body: DeleteMessageDto) {
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
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const messageId = parseInt(body.messageId, 10);

      if (Number.isNaN(messageId)) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }

      const message = await this.prismaService.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }

      if (message.senderId !== userId) {
        throw new HttpException(
          'You are not the sender of this message',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prismaService.message.delete({
        where: { id: messageId },
      });

      return {
        code: 1000,
        message: 'Message deleted successfully',
        HttpStatus: HttpStatus.OK,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async blockUser(body: BlockUserDto) {
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
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const conversationId = parseInt(body.conversationId, 10);

      if (Number.isNaN(conversationId)) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }

      const conversation = await this.prismaService.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }

      if (
        conversation.senderId !== userId &&
        conversation.receiverId !== userId
      ) {
        throw new HttpException(
          'You are not in the conversation',
          HttpStatus.NOT_FOUND,
        );
      }

      const isSender = conversation.senderId === userId;
      const updateData = isSender
        ? { senderBlocked: !conversation.senderBlocked }
        : { receiverBlocked: !conversation.receiverBlocked };

      await this.prismaService.conversation.update({
        where: { id: conversationId },
        data: updateData,
      });

      const message =
        updateData.senderBlocked || updateData.receiverBlocked
          ? 'User blocked successfully'
          : 'User unblocked successfully';

      return {
        code: 1000,
        message,
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
