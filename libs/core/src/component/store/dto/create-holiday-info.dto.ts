import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateHolidayInfoDto {
  constructor(body: CreateHolidayInfoDto | null = null) {
    if (body) {
      this.group = body.group;
      this.storeIdList = body.storeIdList;
      this.startDate = body.startDate;
      this.holidayName = body.holidayName;
    }
  }
  @ApiProperty({ type: Number })
  @IsNumber()
  @MaxLength(100)
  readonly group: number;

  @ApiProperty({ type: Number, isArray: true })
  @IsArray()
  @IsInt({ each: true })
  readonly storeIdList: number[];

  @ApiProperty({ type: Date })
  @IsDate()
  readonly startDate: Date;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  readonly holidayName: string;

  @ApiProperty({ type: Number })
  readonly openHours: number;

  @ApiProperty({ type: Number })
  readonly closeHours: number;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  readonly message: string;
}
