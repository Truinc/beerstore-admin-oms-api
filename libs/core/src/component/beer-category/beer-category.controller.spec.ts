import { Test, TestingModule } from '@nestjs/testing';
import { BeerCategoryController } from './beer-category.controller';
import { BeerCategoryService } from './beer-category.service';

describe('BeerCategoryController', () => {
  let controller: BeerCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BeerCategoryController],
      providers: [BeerCategoryService],
    }).compile();

    controller = module.get<BeerCategoryController>(BeerCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
