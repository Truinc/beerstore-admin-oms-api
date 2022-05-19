import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolesEnum } from '../entity/user.entity';

export class UpdateUserDto {
  constructor(body: UpdateUserDto | null = null) {
    if (body) {
      this.email = body.email;
      this.username = body.username;
      this.firstName = body.firstName;
      this.lastName = body.lastName;
      this.employeeId = body.employeeId;
      this.isActive = body.isActive;
      this.role = body.role;
      // this.password = body.password;
      this.manager = body.manager;
    }
  }

  @ApiProperty({ type: String })
  @IsString()
  readonly employeeId: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  readonly username?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly firstName?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly lastName?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsEmail()
  @MaxLength(128)
  readonly email?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly password?: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsEnum(RolesEnum)
  readonly role?: RolesEnum;

  @ApiProperty({ type: Number })
  @IsOptional()
  isActive?: number;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  // @MaxLength(128)
  readonly manager?: string;

  @ApiProperty({ type: Number })
  @IsOptional()
  readonly baseStoreId?: number;

  @ApiProperty({ type: [Number] })
  @IsOptional()
  readonly optionalStoreIds?: number[];

  @ApiProperty({ type: Number })
  @IsOptional()
  readonly loginAttempts?: number;
}
