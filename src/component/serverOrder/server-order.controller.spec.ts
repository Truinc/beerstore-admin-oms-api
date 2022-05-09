import { Test, TestingModule } from '@nestjs/testing';
import { ServerOrderController } from './server-order.controller';

describe('ServerOrderController', () => {
  let controller: ServerOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerOrderController],
    }).compile();

    controller = module.get<ServerOrderController>(ServerOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
