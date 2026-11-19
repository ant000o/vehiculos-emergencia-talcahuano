import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoVehiculo } from './entities/tipo_vehiculo.entity';

@Injectable()
export class TipoVehiculoService {
  constructor(
    @InjectRepository(TipoVehiculo)
    private readonly repo: Repository<TipoVehiculo>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id_tipo_vehiculo: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id_tipo_vehiculo: id } });
  }
}
