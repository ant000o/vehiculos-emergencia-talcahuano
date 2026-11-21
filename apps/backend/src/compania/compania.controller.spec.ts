import { Test, TestingModule } from '@nestjs/testing';
import { CompaniaController } from './compania.controller';
import { CompaniaService } from './compania.service';

describe('CompaniaController', () => {
  let controller: CompaniaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniaController],
      providers: [CompaniaService],
    }).compile();

    controller = module.get<CompaniaController>(CompaniaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
