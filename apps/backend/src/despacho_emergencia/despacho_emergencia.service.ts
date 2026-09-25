import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DespachoEmergencia } from './entities/despacho_emergencia.entity';
import { CreateDespachoEmergenciaDto } from './dto/create-despacho_emergencia.dto';
import { UpdateDespachoEmergenciaDto } from './dto/update-despacho_emergencia.dto';
import { toPostGIS, fromPostGIS } from '../common/utils/geo.util';

@Injectable()
export class DespachoEmergenciaService {
  constructor(
    @InjectRepository(DespachoEmergencia)
    private readonly repo: Repository<DespachoEmergencia>,
  ) {}

  create(dto: CreateDespachoEmergenciaDto) {
    const despacho = this.repo.create({
      ...dto,
      fecha_hora_despacho: dto.fecha_hora_despacho
        ? new Date(dto.fecha_hora_despacho)
        : new Date(),
      coordenada_destino: toPostGIS(dto.coordenada_destino as any),
    });

    return this.repo.save(despacho);
  }

  async findAll() {
    const items = await this.repo.find({
      relations: {
        vehiculo: true,
        grifo: true,
        compania: true,
        tripulacion: { usuario: true },
      },
    });
    return items.map((d) => ({
      ...d,
      coordenada_destino: fromPostGIS(d.coordenada_destino),
    }));
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id_despacho: id },
      relations: {
        vehiculo: true,
        grifo: true,
        compania: true,
        tripulacion: { usuario: true },
      },
    });

    if (!item) throw new NotFoundException(`Despacho con id ${id} no encontrado`);

    return { ...item, coordenada_destino: fromPostGIS(item.coordenada_destino) };
  }

  async update(id: number, dto: UpdateDespachoEmergenciaDto) {
    const item = await this.repo.findOne({ where: { id_despacho: id } });
    if (!item) throw new NotFoundException(`Despacho con id ${id} no encontrado`);

    Object.assign(item, {
      ...dto,
      ...(dto.coordenada_destino && {
        coordenada_destino: toPostGIS(dto.coordenada_destino as any),
      }),
    });

    const saved = await this.repo.save(item);
    return { ...saved, coordenada_destino: fromPostGIS(saved.coordenada_destino) };
  }

  async remove(id: number) {
    const item = await this.repo.findOne({ where: { id_despacho: id } });
    if (!item) throw new NotFoundException(`Despacho con id ${id} no encontrado`);
    return this.repo.remove(item);
  }
}

