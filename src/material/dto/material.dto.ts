/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { MaterialType } from 'src/utils/enum';

export class getMaterialList {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: number;
}

export class getMaterialInfo {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  materialId: number;
}

export class deleteMaterial {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  materialId: number;
}

export class editMaterial {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  materialId: number;
  @IsOptional()
  @MaxLength(25)
  title?: string;
  @IsOptional()
  @MaxLength(100)
  description?: string;
  @IsOptional()
  type?: MaterialType;
}

export class createMaterial {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  userId: number;
  @IsNotEmpty()
  classId: number;
  @IsNotEmpty()
  @MaxLength(25)
  title: string;
  @IsOptional()
  @MaxLength(100)
  description?: string;
  @IsNotEmpty()
  type: MaterialType;
}