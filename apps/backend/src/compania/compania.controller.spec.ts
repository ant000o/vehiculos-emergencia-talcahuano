import { Test, TestingModule } from '@nestjs/testing';
import { CompañiaController } from './compania.controller';
import { CompañiaService } from './compania.service';

describe('CompañiaController', () => {
  let controller: CompañiaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompañiaController],
      providers: [CompañiaService],
    }).compile();

    controller = module.get<CompañiaController>(CompañiaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
