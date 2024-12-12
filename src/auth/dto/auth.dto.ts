import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  Matches,
} from 'class-validator';

import { UserRole } from 'src/utils/enum';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole, {
    message: 'Role must be either lecturer or student',
  })
  @IsNotEmpty()
  role: UserRole;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class GetVerifyCodeDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @Matches(/hust\.edu\.vn$/, {
    message: 'Email phải thuộc miền hust.edu.vn.',
  })
  email: string;
}

export class VerifyCodeDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @Matches(/hust\.edu\.vn$/, {
    message: 'Email phải thuộc miền hust.edu.vn.',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
