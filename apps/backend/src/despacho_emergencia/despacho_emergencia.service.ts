import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DespachoEmergencia } from './entities/despacho_emergencia.entity';
import { DespachoPersonal } from '../despacho_personal/entities/despacho_personal.entity';
import { DespachoRespuesta } from './entities/despacho_respuesta.entity';
import { ResponderDespachoDto } from './dto/responder-despacho.dto';
import { EstadoEmergencia } from '../common/enums/estados.enum';
import { CreateDespachoEmergenciaDto } from './dto/create-despacho_emergencia.dto';
import { UpdateDespachoEmergenciaDto } from './dto/update-despacho_emergencia.dto';
import { toPostGIS, fromPostGIS } from '../common/utils/geo.util';
import { NotificacionesGateway } from '../notificaciones/notificaciones.gateway';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@Injectable()
export class DespachoEmergenciaService {
  constructor(
    @InjectRepository(DespachoEmergencia)
    private readonly repo: Repository<DespachoEmergencia>,
    @InjectRepository(DespachoPersonal)
    private readonly personalRepo: Repository<DespachoPersonal>,
    @InjectRepository(DespachoRespuesta)
    private readonly respuestaRepo: Repository<DespachoRespuesta>,
    private readonly notificacionesGateway: NotificacionesGateway,
  ) {}

  async create(dto: CreateDespachoEmergenciaDto, user?: JwtPayload, scope?: string) {
    if (scope === 'COMPANY' && user?.id_compania) {
      dto.id_compania = Number(user.id_compania);
    }

    const { tripulacion, ...despachoData } = dto;

    const despacho = this.repo.create({
      ...despachoData,
      fecha_hora_despacho: despachoData.fecha_hora_despacho
        ? new Date(despachoData.fecha_hora_despacho)
        : new Date(),
      coordenada_destino: toPostGIS(despachoData.coordenada_destino as any),
    });

    const saved = await this.repo.save(despacho);

    // Guardar tripulantes si vienen incluidos
    if (tripulacion && tripulacion.length > 0) {
      const registrosTripulacion = tripulacion.map((t) =>
        this.personalRepo.create({
          id_despacho: saved.id_despacho,
          id_usuario: t.id_usuario,
          rol_en_despacho: t.rol_en_despacho,
        }),
      );
      await this.personalRepo.save(registrosTripulacion);
    }

    const completo = await this.findOne(saved.id_despacho);
    this.notificacionesGateway.emitNuevoDespacho(completo);

    return completo;
  }

  async findAll(scope: string = 'GLOBAL', user?: JwtPayload) {
    const qb = this.repo.createQueryBuilder('d')
      .leftJoinAndSelect('d.vehiculo', 'vehiculo')
      .leftJoinAndSelect('d.grifo', 'grifo')
      .leftJoinAndSelect('d.compania', 'compania')
      .leftJoinAndSelect('d.tripulacion', 'tripulacion')
      .leftJoinAndSelect('tripulacion.usuario', 'usuario')
      .orderBy('d.fecha_hora_despacho', 'DESC');

    if (scope === 'COMPANY') {
      if (!user?.id_compania) throw new ForbiddenException('Usuario sin compañía asignada');
      qb.andWhere('d.id_compania = :cid', { cid: user.id_compania });
    } else if (scope === 'PARTICIPATION') {
      if (!user?.sub) throw new ForbiddenException('Usuario no autenticado');
      qb.andWhere(
        'EXISTS (SELECT 1 FROM despacho_personal dp WHERE dp.id_despacho = d.id_despacho AND dp.id_usuario = :uid)',
        { uid: user.sub },
      );
    } else if (scope === 'NONE') {
      throw new ForbiddenException('No tienes acceso al módulo de despachos');
    }

    const items = await qb.getMany();
    return items.map((d) => ({
      ...d,
      coordenada_destino: fromPostGIS(d.coordenada_destino),
    }));
  }

  async findOne(id: number, scope: string = 'GLOBAL', user?: JwtPayload) {
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

    if (scope === 'COMPANY') {
      if (item.id_compania !== Number(user?.id_compania)) {
        throw new ForbiddenException('Acceso denegado: el despacho pertenece a otra compañía');
      }
    } else if (scope === 'PARTICIPATION') {
      const participo = (item.tripulacion || []).some(
        (t) => Number(t.id_usuario) === Number(user?.sub),
      );
      if (!participo) {
        throw new ForbiddenException('Acceso denegado: solo puedes consultar despachos en los que participaste');
      }
    } else if (scope === 'NONE') {
      throw new ForbiddenException('Sin acceso a este despacho');
    }

    return { ...item, coordenada_destino: fromPostGIS(item.coordenada_destino) };
  }

  async update(id: number, dto: UpdateDespachoEmergenciaDto, scope: string = 'GLOBAL', user?: JwtPayload) {
    await this.findOne(id, scope, user);

    const item = await this.repo.findOne({ where: { id_despacho: id } });
    if (!item) throw new NotFoundException(`Despacho con id ${id} no encontrado`);

    const estadoAnterior = item.estado_emergencia;

    Object.assign(item, {
      ...dto,
      ...(dto.coordenada_destino && {
        coordenada_destino: toPostGIS(dto.coordenada_destino as any),
      }),
    });

    await this.repo.save(item);
    const completo = await this.findOne(id);

    // Avisa a mobile y web cuando el despacho cambia de estado
    // (controlado, finalizado o cancelado).
    if (completo.estado_emergencia !== estadoAnterior) {
      this.notificacionesGateway.emitDespachoActualizado(completo);
    }

    return completo;
  }

  /**
   * Un bombero notificado (que no está en la tripulación) indica si va a apoyar o no.
   * No exige pertenecer al despacho: por eso no pasa por findOne con alcance.
   */
  async responder(id: number, dto: ResponderDespachoDto, user: JwtPayload) {
    const rol = String(user.nombre_rol || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    if (rol.includes('mecanic')) {
      throw new ForbiddenException('Tu perfil no participa en despachos de emergencia');
    }

    const despacho = await this.repo.findOne({
      where: { id_despacho: id },
      relations: { tripulacion: true },
    });
    if (!despacho) throw new NotFoundException();

    if (despacho.estado_emergencia !== EstadoEmergencia.EN_CURSO) {
      throw new BadRequestException('El despacho ya no está en curso');
    }

    const yaAsignado = (despacho.tripulacion || []).some(
      (t) => Number(t.id_usuario) === Number(user.sub),
    );
    if (yaAsignado) {
      throw new BadRequestException('Ya estás asignado a este despacho');
    }

    await this.respuestaRepo.save(
      this.respuestaRepo.create({
        id_despacho: id,
        id_usuario: Number(user.sub),
        decision: dto.decision,
        fecha_respuesta: new Date(),
      }),
    );

    const guardada = await this.respuestaRepo.findOne({
      where: { id_despacho: id, id_usuario: Number(user.sub) },
      relations: { usuario: true },
    });

    this.notificacionesGateway.emitRespuestaApoyo({
      id_despacho: id,
      id_usuario: Number(user.sub),
      nombre: guardada?.usuario?.nombre,
      apellidos: guardada?.usuario?.apellidos,
      decision: dto.decision,
    });

    return { id_despacho: id, decision: dto.decision };
  }

  /** Quién respondió "voy" / "no voy" a un despacho (para Central y capitanes). */
  async listarRespuestas(id: number, scope: string = 'GLOBAL', user?: JwtPayload) {
    await this.findOne(id, scope, user);
    const filas = await this.respuestaRepo.find({
      where: { id_despacho: id },
      relations: { usuario: true },
      order: { fecha_respuesta: 'ASC' },
    });
    return filas.map((r) => ({
      id_usuario: r.id_usuario,
      nombre: r.usuario?.nombre,
      apellidos: r.usuario?.apellidos,
      decision: r.decision,
      fecha_respuesta: r.fecha_respuesta,
    }));
  }

  async remove(id: number, scope: string = 'GLOBAL', user?: JwtPayload) {
    await this.findOne(id, scope, user);
    const item = await this.repo.findOne({ where: { id_despacho: id } });
    if (!item) throw new NotFoundException(`Despacho con id ${id} no encontrado`);
    return this.repo.remove(item);
  }
}