import { Test, TestingModule } from '@nestjs/testing';
import { CurbSideController } from './curb-side.controller';

describe('CurbSideController', () => {
  let controller: CurbSideController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurbSideController],
    }).compile();

    controller = module.get<CurbSideController>(CurbSideController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
