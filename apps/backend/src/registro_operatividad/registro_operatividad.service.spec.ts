import { Test, TestingModule } from '@nestjs/testing';
import { RegistroOperatividadService } from './registro_operatividad.service';

describe('RegistroOperatividadService', () => {
  let service: RegistroOperatividadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistroOperatividadService],
    }).compile();

    service = module.get<RegistroOperatividadService>(RegistroOperatividadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
