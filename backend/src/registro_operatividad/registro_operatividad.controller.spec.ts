import { Test, TestingModule } from '@nestjs/testing';
import { RegistroOperatividadController } from './registro_operatividad.controller';
import { RegistroOperatividadService } from './registro_operatividad.service';

describe('RegistroOperatividadController', () => {
  let controller: RegistroOperatividadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistroOperatividadController],
      providers: [RegistroOperatividadService],
    }).compile();

    controller = module.get<RegistroOperatividadController>(RegistroOperatividadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
