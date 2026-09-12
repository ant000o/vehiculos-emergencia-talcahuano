import { Test, TestingModule } from '@nestjs/testing';
import { DetalleArticuloMantencionController } from './detalle_articulo_mantencion.controller';
import { DetalleArticuloMantencionService } from './detalle_articulo_mantencion.service';

describe('DetalleArticuloMantencionController', () => {
  let controller: DetalleArticuloMantencionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DetalleArticuloMantencionController],
      providers: [DetalleArticuloMantencionService],
    }).compile();

    controller = module.get<DetalleArticuloMantencionController>(DetalleArticuloMantencionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
