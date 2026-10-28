
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import {
  MAINTENANCE_INTERVAL_KM,
  MAINTENANCE_WARNING_DELTA_KM,
} from '../common/constants';

import { MantencionService } from '../mantencion/mantencion.service';
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
    private readonly mantencionService: MantencionService,
  ) {}

  // ============================================================
  // CREAR VEHICULO
  // ============================================================

  async create(dto: CreateVehiculoDto) {
    const entity = this.repo.create({
      ...dto,
      ...(dto.coordenadas && {
        coordenadas: toPostGIS(dto.coordenadas as any),
      }),
    });

    const saved = await this.repo.save(entity);

    return {
      ...saved,
      coordenadas: fromPostGIS(saved.coordenadas),
    };
  }

  // ============================================================
  // LISTAR VEHICULOS CON FILTROS Y PAGINACION
  // ============================================================

  async findAll(
    opts: {
      estado?: EstadoVehiculo;
      q?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { estado, q, page = 1, limit = 50 } = opts;

    // Evitar páginas y límites inválidos.
    const currentPage = Math.max(1, Math.floor(page));
    const currentLimit = Math.min(
      100,
      Math.max(1, Math.floor(limit)),
    );

    const where: any[] = [];
    const search = q?.trim();

    if (search) {
      const pattern = ILike(`%${search}%`);
      const estadoFilter = estado
        ? { estado_operativo: estado }
        : {};

      where.push(
        { patente: pattern, ...estadoFilter },
        { marca: pattern, ...estadoFilter },
        { modelo: pattern, ...estadoFilter },
      );
    } else if (estado) {
      where.push({ estado_operativo: estado });
    }

    const [items, total] = await this.repo.findAndCount({
      where: where.length > 0 ? where : undefined,
      relations: {
        compania: true,
      },
      skip: (currentPage - 1) * currentLimit,
      take: currentLimit,
      order: {
        id_vehiculo: 'ASC',
      },
    });

    return {
      data: items.map((vehiculo) => ({
        ...vehiculo,
        coordenadas: fromPostGIS(vehiculo.coordenadas),
        proxima_mantencion: Number(vehiculo.kilometraje ?? 0) + 10000,
      })),
      total,
      page: currentPage,
      limit: currentLimit,
      pages: Math.ceil(total / currentLimit),
    };
  }

  // ============================================================
  // OBTENER UN VEHICULO
  // ============================================================

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
        `Vehiculo con id ${id} no encontrado`,
      );
    }

    return {
      ...item,
      coordenadas: fromPostGIS(item.coordenadas),
      proxima_mantencion: Number(item.kilometraje ?? 0) + 10000,
    };
  }

  // ============================================================
  // OBTENER REGISTROS DE OPERATIVIDAD
  // ============================================================

  async findRegistros(id: number) {
    const item = await this.repo.findOne({
      where: {
        id_vehiculo: id,
      },
      relations: {
        registros_operatividad: {
          usuario: true,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Vehiculo con id ${id} no encontrado`,
      );
    }

    return item.registros_operatividad ?? [];
  }

  // ============================================================
  // OBTENER MANTENCIONES DEL VEHICULO
  // ============================================================

  async findMantenciones(id: number) {
    const item = await this.repo.findOne({
      where: {
        id_vehiculo: id,
      },
      relations: {
        mantenciones: {
          usuarioMecanico: true,
          detalles_articulos: {
            articulo: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Vehiculo con id ${id} no encontrado`,
      );
    }

    return item.mantenciones ?? [];
  }

  // ============================================================
  // ACTUALIZAR VEHICULO
  // ============================================================

  async update(id: number, dto: UpdateVehiculoDto) {
    const item = await this.repo.findOne({
      where: {
        id_vehiculo: id,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Vehiculo con id ${id} no encontrado`,
      );
    }

    const oldKm = Number(item.kilometraje ?? 0);
    const estadoAnterior = item.estado_operativo;

    // Actualizar los datos del vehículo.
    Object.assign(item, {
      ...dto,
      ...(dto.coordenadas && {
        coordenadas: toPostGIS(dto.coordenadas as any),
      }),
    });

    const saved = await this.repo.save(item);
    const newKm = Number(saved.kilometraje ?? 0);

    // ----------------------------------------------------------
    // 1. MANTENCIONES AUTOMATICAS POR INTERVALO
    // ----------------------------------------------------------

    const intervalo = MAINTENANCE_INTERVAL_KM;

    const kilometrajeValido =
      Number.isFinite(oldKm) &&
      Number.isFinite(newKm) &&
      oldKm >= 0 &&
      newKm >= 0 &&
      newKm > oldKm;

    if (
      kilometrajeValido &&
      Number.isFinite(intervalo) &&
      intervalo > 0
    ) {
      // Primer múltiplo del intervalo superior al kilometraje anterior.
      let siguienteKm =
        (Math.floor(oldKm / intervalo) + 1) * intervalo;

      while (siguienteKm <= newKm) {
        await this.mantencionService.createAutomatica({
          tipo_mantencion: 'correctiva' as any,
          id_vehiculo: id,
          kilometraje: siguienteKm,
          descripcion_falla: `Kilometraje ${siguienteKm} km: mantención automática.`,
          estado_mantencion: 'en_proceso' as any,
          taller_externo: 'Automatico',
        });

        siguienteKm += intervalo;
      }
    }

    // ----------------------------------------------------------
    // 2. ALERTA DE FALLA GRAVE
    // ----------------------------------------------------------

    if (
      saved.estado_operativo ===
        EstadoVehiculo.FUERA_DE_SERVICIO &&
      estadoAnterior !== EstadoVehiculo.FUERA_DE_SERVICIO
    ) {
      this.notificacionesGateway.emitAlertaFallaGrave(
        saved,
        `Vehículo ${saved.patente} acaba de ser reportado Fuera de Servicio.`,
      );
    }

    // ----------------------------------------------------------
    // 3. ALERTA DE MANTENCION PROXIMA
    // ----------------------------------------------------------

    const deltaAviso = MAINTENANCE_WARNING_DELTA_KM;

    if (
      kilometrajeValido &&
      Number.isFinite(intervalo) &&
      intervalo > 0 &&
      Number.isFinite(deltaAviso) &&
      deltaAviso > 0 &&
      deltaAviso < intervalo
    ) {
      // Próximo múltiplo real del intervalo según el kilometraje anterior.
      const proximoUmbral =
        (Math.floor(oldKm / intervalo) + 1) * intervalo;

      const inicioAviso = proximoUmbral - deltaAviso;

      // Emitir solamente al cruzar el inicio de la zona de aviso.
      const entroEnZonaAviso =
        oldKm < inicioAviso &&
        newKm >= inicioAviso &&
        newKm < proximoUmbral;

      if (entroEnZonaAviso) {
        const distanciaRestante = proximoUmbral - newKm;

        const mensaje =
          `El vehículo ${saved.patente} está a ` +
          `${distanciaRestante} km de la próxima mantención programada.`;

        this.notificacionesGateway.emitMantencionProxima(
          saved,
          mensaje,
        );
      }
    }

    return {
      ...saved,
      coordenadas: fromPostGIS(saved.coordenadas),
    };
  }

  // ============================================================
  // ELIMINAR VEHICULO
  // ============================================================

  async remove(id: number) {
    const item = await this.repo.findOne({
      where: {
        id_vehiculo: id,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Vehiculo con id ${id} no encontrado`,
      );
    }

    return this.repo.remove(item);
  }
}

