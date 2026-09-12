import { Test, TestingModule } from '@nestjs/testing';
import { GrifoService } from './grifo.service';

describe('GrifoService', () => {
  let service: GrifoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GrifoService],
    }).compile();

    service = module.get<GrifoService>(GrifoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
