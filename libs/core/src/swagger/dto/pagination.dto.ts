import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PaginationInputDto {
  @ApiPropertyOptional({
    type: Number,
    default: 10,
  })
  @IsOptional()
  take?: number = 0;

  @ApiPropertyOptional({
    type: Number,
    default: 0,
  })
  @IsOptional()
  skip?: number = 0;

  @ApiPropertyOptional({
    type: String,
    description: 'createdDate: ASC,updatedDate: DESC',
  })
  @IsOptional()
  sort?: object = null;
}
