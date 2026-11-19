import { Test, TestingModule } from '@nestjs/testing';
import { DespachoEmergenciaService } from './despacho_emergencia.service';

describe('DespachoEmergenciaService', () => {
  let service: DespachoEmergenciaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DespachoEmergenciaService],
    }).compile();

    service = module.get<DespachoEmergenciaService>(DespachoEmergenciaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
