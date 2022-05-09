import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmptyObject, IsObject, ValidateNested } from 'class-validator';
import { LineItem } from './create-cart.dto';

export class UpdateLineItem extends LineItem {}

export class UpdateCartDto {
  @ApiProperty({ type: UpdateLineItem })
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateLineItem)
  readonly line_item: UpdateLineItem;
}
