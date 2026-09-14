import { Test, TestingModule } from '@nestjs/testing';
import { MantencionService } from './mantencion.service';

describe('MantencionService', () => {
  let service: MantencionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MantencionService],
    }).compile();

    service = module.get<MantencionService>(MantencionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
