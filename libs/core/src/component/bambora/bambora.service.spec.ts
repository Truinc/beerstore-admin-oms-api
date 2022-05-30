import { Test, TestingModule } from '@nestjs/testing';
import { BamboraService } from './bambora.service';

describe('BamboraService', () => {
  let service: BamboraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BamboraService],
    }).compile();

    service = module.get<BamboraService>(BamboraService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
