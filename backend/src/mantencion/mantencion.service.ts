import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mantencion } from './entities/mantencion.entity';
import { Vehiculo } from '../vehiculo/entities/vehiculo.entity';
import { CreateMantencionDto } from './dto/create-mantencion.dto';
import { UpdateMantencionDto } from './dto/update-mantencion.dto';
import { EstadoMantencion, EstadoVehiculo, TipoMantencion } from '../common/enums/estados.enum';

import { NotificacionesGateway } from '../notificaciones/notificaciones.gateway';

@Injectable()
export class MantencionService {
  constructor(
    @InjectRepository(Mantencion)
    private readonly repo: Repository<Mantencion>,
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
    private readonly notificacionesGateway: NotificacionesGateway,
  ) {}

  async create(dto: CreateMantencionDto) {
    if ((dto.id_usuario_mecanico && dto.taller_externo) || (!dto.id_usuario_mecanico && !dto.taller_externo)) {
      throw new BadRequestException('Debe indicar exactamente uno: id_usuario_mecanico o taller_externo');
    }
    const entity = this.repo.create(dto);
    const saved = await this.repo.save(entity);

    // Si se especificó kilometraje al ingreso, actualizar odómetro del vehículo si es mayor
    if (dto.kilometraje !== undefined && dto.kilometraje !== null) {
      const veh = await this.vehiculoRepo.findOne({ where: { id_vehiculo: dto.id_vehiculo } });
      if (veh && (veh.kilometraje === null || dto.kilometraje > veh.kilometraje)) {
        await this.vehiculoRepo.update(dto.id_vehiculo, { kilometraje: dto.kilometraje });
      }
    }

    if (dto.tipo_mantencion === TipoMantencion.EMERGENCIA) {
      await this.vehiculoRepo.update(dto.id_vehiculo, { estado_operativo: EstadoVehiculo.FUERA_DE_SERVICIO });
      const veh = await this.vehiculoRepo.findOne({ where: { id_vehiculo: dto.id_vehiculo } });
      this.notificacionesGateway.emitAlertaFallaGrave(
        veh,
        `Falla grave reportada en ${veh?.patente ?? 'vehículo'}: ${dto.descripcion_falla || 'Unidad Fuera de Servicio'}`,
      );
    } else if (dto.estado_mantencion === EstadoMantencion.EN_PROCESO) {
      await this.vehiculoRepo.update(dto.id_vehiculo, { estado_operativo: EstadoVehiculo.EN_MANTENCION });
    }
    return saved;
  }

  /** Crea una mantención automática por intervalo de km (sin validar mecánico/taller). */
  async createAutomatica(data: {
    tipo_mantencion: any;
    id_vehiculo: number;
    kilometraje: number;
    descripcion_falla: string;
    estado_mantencion: any;
    taller_externo: string;
  }) {
    const entity = this.repo.create(data as any);
    const saved = await this.repo.save(entity);
    // Poner el vehículo en mantencion
    await this.vehiculoRepo.update(data.id_vehiculo, { estado_operativo: EstadoVehiculo.EN_MANTENCION });
    return saved;
  }

  findAll(opts: { id_vehiculo?: number; estado?: EstadoMantencion; tipo?: TipoMantencion } = {}) {
    const where: any = {};
    if (opts.id_vehiculo) where.id_vehiculo = opts.id_vehiculo;
    if (opts.estado) where.estado_mantencion = opts.estado;
    if (opts.tipo) where.tipo_mantencion = opts.tipo;
    return this.repo.find({
      where: Object.keys(where).length ? where : undefined,
      relations: { vehiculo: true, usuarioMecanico: true, detalles_articulos: { articulo: true } },
      order: { fecha_ingreso: 'DESC' },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id_mantencion: id },
      relations: { vehiculo: true, usuarioMecanico: true, detalles_articulos: { articulo: true } },
    });
    if (!item) throw new NotFoundException(`Mantención con id ${id} no encontrada`);
    return item;
  }

  async update(id: number, dto: UpdateMantencionDto) {
    if (dto.id_usuario_mecanico && dto.taller_externo) {
      throw new BadRequestException('No puede asignar id_usuario_mecanico y taller_externo simultáneamente');
    }
    const item = await this.findOne(id);
    Object.assign(item, dto);
    const saved = await this.repo.save(item);

    // Si se actualiza el kilometraje, sincronizar con el odómetro del vehículo si es mayor
    if (dto.kilometraje !== undefined && dto.kilometraje !== null) {
      const veh = await this.vehiculoRepo.findOne({ where: { id_vehiculo: item.id_vehiculo } });
      if (veh && (veh.kilometraje === null || dto.kilometraje > veh.kilometraje)) {
        await this.vehiculoRepo.update(item.id_vehiculo, { kilometraje: dto.kilometraje });
      }
    }

    if (dto.estado_mantencion === EstadoMantencion.FINALIZADA || dto.estado_mantencion === EstadoMantencion.CANCELADA) {
      await this.vehiculoRepo.update(item.id_vehiculo, { estado_operativo: EstadoVehiculo.OPERATIVO });
    }
    return saved;
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    return this.repo.remove(item);
  }
}
