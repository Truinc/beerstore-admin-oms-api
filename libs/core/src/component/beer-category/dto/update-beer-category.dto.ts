import { PartialType } from '@nestjs/mapped-types';
import { CreateBeerCategoryDto } from './create-beer-category.dto';

export class UpdateBeerCategoryDto extends PartialType(CreateBeerCategoryDto) {}
