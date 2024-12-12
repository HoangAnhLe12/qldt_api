import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ClassModule } from './class/class.module';
import { MaterialModule } from './material/material.module';
import { SurveyModule } from './survey/survey.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AbsenceModule } from './absence/absence.module';
import { AssignmentModule } from './assignment/assignment.module';
import { ConversationModule } from './conversation/conversation.module';
import { NotificationModule } from './notification/notification.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    ClassModule,
    MaterialModule,
    SurveyModule,
    AttendanceModule,
    AbsenceModule,
    AssignmentModule,
    ConversationModule,
    NotificationModule,
    SystemModule,
  ],
})
export class AppModule {}
