import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DespachoEmergencia } from './entities/despacho_emergencia.entity';
import { CreateDespachoEmergenciaDto } from './dto/create-despacho_emergencia.dto';
import { UpdateDespachoEmergenciaDto } from './dto/update-despacho_emergencia.dto';

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
    });

    return this.repo.save(despacho);
  }

  findAll() {
    return this.repo.find({
      relations: {
        vehiculo: true,
        grifo: true,
        compania: true,
        tripulacion: {
          usuario: true,
        },
      },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id_despacho: id },
      relations: {
        vehiculo: true,
        grifo: true,
        compania: true,
        tripulacion: {
          usuario: true,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Despacho con id ${id} no encontrado`,
      );
    }

    return item;
  }

  async update(id: number, dto: UpdateDespachoEmergenciaDto) {
    const item = await this.findOne(id);

    Object.assign(item, dto);

    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);

    return this.repo.remove(item);
  }
}
