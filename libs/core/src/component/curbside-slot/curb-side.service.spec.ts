import { Test, TestingModule } from '@nestjs/testing';
import { CurbSideService } from './curb-side.service';

describe('CurbSideService', () => {
  let service: CurbSideService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CurbSideService],
    }).compile();

    service = module.get<CurbSideService>(CurbSideService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
