import { Test, TestingModule } from '@nestjs/testing';
import { CategoriaArticuloService } from './categoria_articulo.service';

describe('CategoriaArticuloService', () => {
  let service: CategoriaArticuloService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriaArticuloService],
    }).compile();

    service = module.get<CategoriaArticuloService>(CategoriaArticuloService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
