import { Test, TestingModule } from '@nestjs/testing';
import { DetalleArticuloMantencionService } from './detalle_articulo_mantencion.service';

describe('DetalleArticuloMantencionService', () => {
  let service: DetalleArticuloMantencionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DetalleArticuloMantencionService],
    }).compile();

    service = module.get<DetalleArticuloMantencionService>(DetalleArticuloMantencionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
