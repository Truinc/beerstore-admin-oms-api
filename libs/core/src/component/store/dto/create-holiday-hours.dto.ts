import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateHolidayHoursDto {
  constructor(body: CreateHolidayHoursDto | null = null) {
    if (body) {
      this.startDate = body.startDate;
      this.endDate = body.endDate;
      this.title = body.title;
      this.color = body.color;
      this.messages = body.messages;
      this.id = body.id;
    }
  }

  @ApiProperty({ type: Number })
  @IsOptional()
  id: number;

  @ApiProperty({ type: Date })
  @IsDate()
  readonly startDate: Date;

  @ApiProperty({ type: Date })
  @IsDate()
  readonly endDate: Date;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  readonly title: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  readonly color: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  readonly messages: string;
}
