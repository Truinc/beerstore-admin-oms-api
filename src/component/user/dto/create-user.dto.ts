import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolesEnum } from '../entity/user.entity';

export class CreateUserDto {
  constructor(body: CreateUserDto | null = null) {
    if (body) {
      this.username = body.username;
      this.password = body.password;
      this.email = body.email;
      this.firstName = body.firstName;
      this.lastName = body.lastName;
      this.isActive = body.isActive;
      this.role = body.role;
      this.baseStoreId = body.baseStoreId;
    }
  }

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  readonly username: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  readonly password: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  readonly firstName: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(64)
  readonly lastName: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(128)
  readonly email: string;

  @ApiProperty({ type: String, default: 'staff' })
  @IsNotEmpty()
  @IsEnum(RolesEnum)
  readonly role: RolesEnum;

  @ApiProperty({ type: Number, default: 1 })
  isActive: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  baseStoreId: number;
}
