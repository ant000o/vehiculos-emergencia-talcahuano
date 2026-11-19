import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permiso } from './entities/permiso.entity';

@Injectable()
export class PermisoService {
  constructor(
    @InjectRepository(Permiso)
    private readonly repo: Repository<Permiso>,
  ) {}

  findAll() {
    return this.repo.find({ order: { modulo: 'ASC', codigo: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id_permiso: id } });
  }
}
