import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettingDto {
  constructor(body: CreateSettingDto | null = null) {
    if (body) {
      this.settingName = body.settingName;
      this.settingValue = body.settingValue;
    }
  }

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  readonly settingName: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  readonly settingValue: string;
}
