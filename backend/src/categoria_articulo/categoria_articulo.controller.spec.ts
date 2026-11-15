import { Test, TestingModule } from '@nestjs/testing';
import { CategoriaArticuloController } from './categoria_articulo.controller';
import { CategoriaArticuloService } from './categoria_articulo.service';

describe('CategoriaArticuloController', () => {
  let controller: CategoriaArticuloController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriaArticuloController],
      providers: [CategoriaArticuloService],
    }).compile();

    controller = module.get<CategoriaArticuloController>(CategoriaArticuloController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
