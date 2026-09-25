import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grifo } from './entities/grifo.entity';
import { CreateGrifoDto } from './dto/create-grifo.dto';
import { UpdateGrifoDto } from './dto/update-grifo.dto';
import { toPostGIS, fromPostGIS } from '../common/utils/geo.util';

@Injectable()
export class GrifoService {
  constructor(
    @InjectRepository(Grifo)
    private readonly repo: Repository<Grifo>,
  ) {}

  create(dto: CreateGrifoDto) {
    // El cliente manda [lat, lng] → convertimos a [lng, lat] para PostGIS
    const entity = this.repo.create({
      ...dto,
      coordenadas: toPostGIS(dto.coordenadas as any),
    });
    return this.repo.save(entity);
  }

  async findAll() {
    const items = await this.repo.find({ relations: { compania: true } });
    // Convertimos coordenadas de vuelta a [lat, lng] para el cliente
    return items.map((g) => ({ ...g, coordenadas: fromPostGIS(g.coordenadas) }));
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id_grifo: id },
      relations: { compania: true },
    });

    if (!item) throw new NotFoundException(`Grifo con id ${id} no encontrado`);

    return { ...item, coordenadas: fromPostGIS(item.coordenadas) };
  }

  async update(id: number, dto: UpdateGrifoDto) {
    const item = await this.repo.findOne({ where: { id_grifo: id } });
    if (!item) throw new NotFoundException(`Grifo con id ${id} no encontrado`);

    Object.assign(item, {
      ...dto,
      ...(dto.coordenadas && { coordenadas: toPostGIS(dto.coordenadas as any) }),
    });

    const saved = await this.repo.save(item);
    return { ...saved, coordenadas: fromPostGIS(saved.coordenadas) };
  }

  async remove(id: number) {
    const item = await this.repo.findOne({ where: { id_grifo: id } });
    if (!item) throw new NotFoundException(`Grifo con id ${id} no encontrado`);
    return this.repo.remove(item);
  }
}

