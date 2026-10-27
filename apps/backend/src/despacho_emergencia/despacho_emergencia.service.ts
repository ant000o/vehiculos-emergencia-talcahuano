import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DespachoEmergencia } from './entities/despacho_emergencia.entity';
import { DespachoPersonal } from '../despacho_personal/entities/despacho_personal.entity';
import { CreateDespachoEmergenciaDto } from './dto/create-despacho_emergencia.dto';
import { UpdateDespachoEmergenciaDto } from './dto/update-despacho_emergencia.dto';
import { toPostGIS, fromPostGIS } from '../common/utils/geo.util';
import { NotificacionesGateway } from '../notificaciones/notificaciones.gateway';

@Injectable()
export class DespachoEmergenciaService {
  constructor(
    @InjectRepository(DespachoEmergencia)
    private readonly repo: Repository<DespachoEmergencia>,
    @InjectRepository(DespachoPersonal)
    private readonly personalRepo: Repository<DespachoPersonal>,
    private readonly notificacionesGateway: NotificacionesGateway,
  ) {}

  async create(dto: CreateDespachoEmergenciaDto) {
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
    
    // Buscar con relaciones completas para enviar todo el contexto por socket
    const completo = await this.findOne(saved.id_despacho);
    
    // HU-20 / HU-21: Notificar a todos los clientes (especialmente app movil)
    this.notificacionesGateway.emitNuevoDespacho(completo);

    return completo;
  }

  async findAll() {
    const items = await this.repo.find({
      relations: {
        vehiculo: true,
        grifo: true,
        compania: true,
        tripulacion: { usuario: true },
      },
      order: { fecha_hora_despacho: 'DESC' },
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

    await this.repo.save(item);
    return this.findOne(id);
  }

  async remove(id: number) {
    const item = await this.repo.findOne({ where: { id_despacho: id } });
    if (!item) throw new NotFoundException(`Despacho con id ${id} no encontrado`);
    return this.repo.remove(item);
  }
}
