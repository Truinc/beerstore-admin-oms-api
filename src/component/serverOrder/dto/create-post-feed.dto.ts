import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
} from 'class-validator';

export class CreatePostFeedDto {
  constructor(body: CreatePostFeedDto | null = null) {
    if (body) {
      this.userId = body.userId;
      this.feed = body.feed;
      this.orderId = body.orderId;
    }
  }
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(99)
  readonly orderId: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  // @MaxLength(299)
  readonly feed: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  // @IsString()
  // @MinLength(1)
  // @MaxLength(99)
  readonly userId: number;
}
