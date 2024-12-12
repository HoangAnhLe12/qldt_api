import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() //This module is global-scoped, meaning that it can be imported by any module in the application.
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
