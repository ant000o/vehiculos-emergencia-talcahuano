import { Test, TestingModule } from '@nestjs/testing';
import { ArticuloInventarioService } from './articulo_inventario.service';

describe('ArticuloInventarioService', () => {
  let service: ArticuloInventarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArticuloInventarioService],
    }).compile();

    service = module.get<ArticuloInventarioService>(ArticuloInventarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
