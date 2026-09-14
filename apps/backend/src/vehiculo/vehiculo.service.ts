import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@Injectable()
export class VehiculoService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly repo: Repository<Vehiculo>,
  ) {}

  create(dto: CreateVehiculoDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({
      relations: {
        compania: true,
      },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: {
        id_vehiculo: id,
      },
      relations: {
        compania: true,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Vehículo con id ${id} no encontrado`,
      );
    }

    return item;
  }

  async update(id: number, dto: UpdateVehiculoDto) {
    const item = await this.findOne(id);

    Object.assign(item, dto);

    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);

    return this.repo.remove(item);
  }
}
