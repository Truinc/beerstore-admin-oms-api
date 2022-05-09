import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { CreateHolidayHoursDto } from './create-holiday-hours.dto';
import { CreateHolidayInfoDto } from './create-holiday-info.dto';

export class CreateDto {
  @ApiProperty({ type: CreateHolidayHoursDto })
  readonly holidayHour: CreateHolidayHoursDto;

  @ApiProperty({ type: [CreateHolidayInfoDto] })
  @IsArray()
  readonly holidayInfo: CreateHolidayInfoDto[];
}
