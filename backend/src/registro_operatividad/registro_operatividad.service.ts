import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroOperatividad } from './entities/registro_operatividad.entity';
import { CreateRegistroOperatividadDto } from './dto/create-registro_operatividad.dto';
import { UpdateRegistroOperatividadDto } from './dto/update-registro_operatividad.dto';

import { NotificacionesGateway } from '../notificaciones/notificaciones.gateway';

@Injectable()
export class RegistroOperatividadService {
  constructor(
    @InjectRepository(RegistroOperatividad)
    private readonly repo: Repository<RegistroOperatividad>,
    private readonly notificacionesGateway: NotificacionesGateway,
  ) {}

  async create(dto: CreateRegistroOperatividadDto) {
    const saved = await this.repo.save(this.repo.create(dto));
    if (Number(dto.nivel_combustible) < 20 || Number(dto.nivel_aceite) < 20 || Number(dto.nivel_agua) < 20) {
      const reg = await this.findOne(saved.id_registro).catch(() => null);
      if (reg) {
        this.notificacionesGateway.emitAlertaFallaGrave(
          reg.vehiculo,
          `Nivel crítico reportado en ${reg.vehiculo?.patente ?? 'unidad'}: Combustible ${dto.nivel_combustible}%, Agua ${dto.nivel_agua}%, Aceite ${dto.nivel_aceite}%`,
        );
      }
    }
    return saved;
  }

  findAll(id_vehiculo?: number) {
    return this.repo.find({
      where: id_vehiculo ? { id_vehiculo } : undefined,
      relations: { usuario: true, vehiculo: true },
      order: { fecha_hora_registro: 'DESC' },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id_registro: id }, relations: { usuario: true, vehiculo: true } });
    if (!item) throw new NotFoundException(`Registro con id ${id} no encontrado`);
    return item;
  }

  async update(id: number, dto: UpdateRegistroOperatividadDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    return this.repo.remove(item);
  }
}
