import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { toPostGIS, fromPostGIS } from '../common/utils/geo.util';

@Injectable()
export class VehiculoService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly repo: Repository<Vehiculo>,
  ) {}

  create(dto: CreateVehiculoDto) {
    const entity = this.repo.create({
      ...dto,
      ...(dto.coordenadas && { coordenadas: toPostGIS(dto.coordenadas as any) }),
    });
    return this.repo.save(entity);
  }

  async findAll() {
    const items = await this.repo.find({ relations: { compania: true } });
    return items.map((v) => ({ ...v, coordenadas: fromPostGIS(v.coordenadas) }));
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id_vehiculo: id },
      relations: { compania: true },
    });

    if (!item) throw new NotFoundException(`Vehículo con id ${id} no encontrado`);

    return { ...item, coordenadas: fromPostGIS(item.coordenadas) };
  }

  async update(id: number, dto: UpdateVehiculoDto) {
    const item = await this.repo.findOne({ where: { id_vehiculo: id } });
    if (!item) throw new NotFoundException(`Vehículo con id ${id} no encontrado`);

    Object.assign(item, {
      ...dto,
      ...(dto.coordenadas && { coordenadas: toPostGIS(dto.coordenadas as any) }),
    });

    const saved = await this.repo.save(item);
    return { ...saved, coordenadas: fromPostGIS(saved.coordenadas) };
  }

  async remove(id: number) {
    const item = await this.repo.findOne({ where: { id_vehiculo: id } });
    if (!item) throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    return this.repo.remove(item);
  }
}
