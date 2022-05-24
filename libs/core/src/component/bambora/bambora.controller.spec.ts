import { Test, TestingModule } from '@nestjs/testing';
import { BamboraController } from './bambora.controller';
import { BamboraService } from './bambora.service';

describe('BamboraController', () => {
  let controller: BamboraController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BamboraController],
      providers: [BamboraService],
    }).compile();

    controller = module.get<BamboraController>(BamboraController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
