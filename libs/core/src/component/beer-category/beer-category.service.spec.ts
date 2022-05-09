import { Test, TestingModule } from '@nestjs/testing';
import { BeerCategoryService } from './beer-category.service';

describe('BeerCategoryService', () => {
  let service: BeerCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BeerCategoryService],
    }).compile();

    service = module.get<BeerCategoryService>(BeerCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
