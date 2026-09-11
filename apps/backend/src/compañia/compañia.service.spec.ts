import { Test, TestingModule } from '@nestjs/testing';
import { CompañiaService } from './compañia.service';

describe('CompañiaService', () => {
  let service: CompañiaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompañiaService],
    }).compile();

    service = module.get<CompañiaService>(CompañiaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
