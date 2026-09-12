import { Test, TestingModule } from '@nestjs/testing';
import { MantencionController } from './mantencion.controller';
import { MantencionService } from './mantencion.service';

describe('MantencionController', () => {
  let controller: MantencionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MantencionController],
      providers: [MantencionService],
    }).compile();

    controller = module.get<MantencionController>(MantencionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
