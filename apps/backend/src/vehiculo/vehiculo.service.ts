import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { toPostGIS, fromPostGIS } from '../common/utils/geo.util';
import { EstadoVehiculo } from '../common/enums/estados.enum';
import { NotificacionesGateway } from '../notificaciones/notificaciones.gateway';

@Injectable()
export class VehiculoService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly repo: Repository<Vehiculo>,
    private readonly notificacionesGateway: NotificacionesGateway,
  ) {}

  create(dto: CreateVehiculoDto) {
    const entity = this.repo.create({
      ...dto,
      ...(dto.coordenadas && { coordenadas: toPostGIS(dto.coordenadas as any) }),
    });
    return this.repo.save(entity);
  }

  async findAll(opts: { estado?: EstadoVehiculo; q?: string; page?: number; limit?: number } = {}) {
    const { estado, q, page = 1, limit = 50 } = opts;
    const where: any[] = [];
    if (q) {
      const pattern = ILike(`%${q}%`);
      const ef = estado ? { estado_operativo: estado } : {};
      where.push({ patente: pattern, ...ef }, { marca: pattern, ...ef }, { modelo: pattern, ...ef });
    } else if (estado) {
      where.push({ estado_operativo: estado });
    }
    const [items, total] = await this.repo.findAndCount({
      where: where.length ? where : undefined,
      relations: { compania: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { id_vehiculo: 'ASC' },
    });
    return {
      data: items.map((v) => ({ ...v, coordenadas: fromPostGIS(v.coordenadas) })),
      total, page, limit, pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id_vehiculo: id }, relations: { compania: true } });
    if (!item) throw new NotFoundException(`Vehiculo con id ${id} no encontrado`);
    return { ...item, coordenadas: fromPostGIS(item.coordenadas) };
  }

  async findRegistros(id: number) {
    const item = await this.repo.findOne({
      where: { id_vehiculo: id },
      relations: { registros_operatividad: { usuario: true } },
    });
    if (!item) throw new NotFoundException(`Vehiculo con id ${id} no encontrado`);
    return item.registros_operatividad ?? [];
  }

  async findMantenciones(id: number) {
    const item = await this.repo.findOne({
      where: { id_vehiculo: id },
      relations: { mantenciones: { usuarioMecanico: true, detalles_articulos: { articulo: true } } },
    });
    if (!item) throw new NotFoundException(`Vehiculo con id ${id} no encontrado`);
    return item.mantenciones ?? [];
  }

  async update(id: number, dto: UpdateVehiculoDto) {
    const item = await this.repo.findOne({ where: { id_vehiculo: id } });
    if (!item) throw new NotFoundException(`Vehiculo con id ${id} no encontrado`);
    
    const estadoAnterior = item.estado_operativo;
    Object.assign(item, { ...dto, ...(dto.coordenadas && { coordenadas: toPostGIS(dto.coordenadas as any) }) });
    const saved = await this.repo.save(item);

    // HU-16: Emitir alerta si pasó a Fuera de Servicio
    if (saved.estado_operativo === EstadoVehiculo.FUERA_DE_SERVICIO && estadoAnterior !== EstadoVehiculo.FUERA_DE_SERVICIO) {
      this.notificacionesGateway.emitAlertaFallaGrave(saved, `Vehículo ${saved.patente} acaba de ser reportado Fuera de Servicio.`);
    }

    return { ...saved, coordenadas: fromPostGIS(saved.coordenadas) };
  }

  async remove(id: number) {
    const item = await this.repo.findOne({ where: { id_vehiculo: id } });
    if (!item) throw new NotFoundException(`Vehiculo con id ${id} no encontrado`);
    return this.repo.remove(item);
  }
}
