import { Test, TestingModule } from '@nestjs/testing';
import { CompañiaController } from './compañia.controller';
import { CompañiaService } from './compañia.service';

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
