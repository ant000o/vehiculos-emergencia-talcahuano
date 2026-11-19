import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialCambios } from './entities/historial_cambios.entity';

@Injectable()
export class HistorialCambiosService {
  constructor(
    @InjectRepository(HistorialCambios)
    private readonly repo: Repository<HistorialCambios>,
  ) {}

  findAll(opts?: { tabla?: string; limit?: number }) {
    const limit = opts?.limit ? Math.min(100, opts.limit) : 50;
    return this.repo.find({
      where: opts?.tabla ? { tabla_afectada: opts.tabla } : undefined,
      order: { fecha_hora: 'DESC' },
      take: limit,
    });
  }

  findByTabla(tabla: string) {
    return this.repo.find({
      where: { tabla_afectada: tabla },
      order: { fecha_hora: 'DESC' },
      take: 50,
    });
  }
}
