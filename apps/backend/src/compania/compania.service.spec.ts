import { Test, TestingModule } from '@nestjs/testing';
import { CompaniaService } from './compania.service';

describe('CompaniaService', () => {
  let service: CompaniaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompaniaService],
    }).compile();

    service = module.get<CompaniaService>(CompaniaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
