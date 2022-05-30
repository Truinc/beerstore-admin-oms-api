import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateSettingDto } from './create-settings.dto';

export class UpdateSettingDto extends CreateSettingDto {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsNumber()
  readonly id?: number;
}
