import { Test, TestingModule } from '@nestjs/testing';
import { GrifoController } from './grifo.controller';
import { GrifoService } from './grifo.service';

describe('GrifoController', () => {
  let controller: GrifoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrifoController],
      providers: [GrifoService],
    }).compile();

    controller = module.get<GrifoController>(GrifoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
