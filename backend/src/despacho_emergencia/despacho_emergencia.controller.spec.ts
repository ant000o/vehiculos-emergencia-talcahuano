import { Test, TestingModule } from '@nestjs/testing';
import { DespachoEmergenciaController } from './despacho_emergencia.controller';
import { DespachoEmergenciaService } from './despacho_emergencia.service';

describe('DespachoEmergenciaController', () => {
  let controller: DespachoEmergenciaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DespachoEmergenciaController],
      providers: [DespachoEmergenciaService],
    }).compile();

    controller = module.get<DespachoEmergenciaController>(DespachoEmergenciaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
