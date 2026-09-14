import { Test, TestingModule } from '@nestjs/testing';
import { ArticuloInventarioController } from './articulo_inventario.controller';
import { ArticuloInventarioService } from './articulo_inventario.service';

describe('ArticuloInventarioController', () => {
  let controller: ArticuloInventarioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticuloInventarioController],
      providers: [ArticuloInventarioService],
    }).compile();

    controller = module.get<ArticuloInventarioController>(ArticuloInventarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
