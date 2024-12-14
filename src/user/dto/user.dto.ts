import { Role } from '@prisma/client';
import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsNotEqualToConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;

    const relatedValue = (args.object as any)[relatedPropertyName];

    return value !== relatedValue;
  }
}

export function IsNotEqualTo(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,

      propertyName: propertyName,

      options: validationOptions,

      constraints: [property],

      validator: IsNotEqualToConstraint,
    });
  };
}

export class GetUserInfoDto {
  @IsNotEmpty()
  token: string;
  @IsOptional()
  userId?: string;
}

export class SetUserInfoDto {
  @IsNotEmpty()
  token: string;
  @IsOptional()
  userName?: string;
  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;
  @IsOptional()
  address?: string;
  @IsOptional()
  avatar?: string;
}
export class ChangePasswordDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  @MinLength(6)
  oldPassword: string;
  @IsNotEqualTo('oldPassword', {
    message: 'New password must not be the same as the old password',
  })
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class SetUserRoleDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  role: Role;
}

export class DeactivateUserDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  userId: string;
}

export class ReactivateUserDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  userId: string;
}
