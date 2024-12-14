/* eslint-disable prettier/prettier */
import { MaterialType } from '@prisma/client';
import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class getMaterialListDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
}

export class getMaterialInfoDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  materialId: string;
}

export class deleteMaterialDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  materialId: string;
}

export class editMaterialDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  materialId: string;
  @IsOptional()
  @MaxLength(25)
  title?: string;
  @IsOptional()
  @MaxLength(100)
  description?: string;
  @IsOptional()
  link?: string;
  @IsOptional()
  type?: MaterialType;
}

export class createMaterialDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  classId: string;
  @IsNotEmpty()
  @MaxLength(25)
  title: string;
  @IsOptional()
  @MaxLength(100)
  description?: string;
  @IsNotEmpty()
  type: MaterialType;
}