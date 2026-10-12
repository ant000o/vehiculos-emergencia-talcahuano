import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Grifo } from './entities/grifo.entity';
import { CreateGrifoDto } from './dto/create-grifo.dto';
import { UpdateGrifoDto } from './dto/update-grifo.dto';
import { toPostGIS, fromPostGIS } from '../common/utils/geo.util';
import { EstadoGrifo } from '../common/enums/estados.enum';

@Injectable()
export class GrifoService {
  constructor(
    @InjectRepository(Grifo)
    private readonly repo: Repository<Grifo>,
    private readonly dataSource: DataSource,
  ) {}

  create(dto: CreateGrifoDto) {
    const entity = this.repo.create({ ...dto, coordenadas: toPostGIS(dto.coordenadas as any) });
    return this.repo.save(entity);
  }

  async findAll(estado?: EstadoGrifo) {
    const items = await this.repo.find({
      where: estado ? { estado_operativo: estado } : undefined,
      relations: { compania: true },
    });
    return items.map((g) => ({ ...g, coordenadas: fromPostGIS(g.coordenadas) }));
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id_grifo: id }, relations: { compania: true } });
    if (!item) throw new NotFoundException(`Grifo con id ${id} no encontrado`);
    return { ...item, coordenadas: fromPostGIS(item.coordenadas) };
  }

  /**
   * Devuelve grifos dentro de un radio (metros) desde un punto [lat, lng].
   * Solo devuelve grifos OPERATIVOS por defecto (el frontend de emergencia lo necesita).
   * GET /grifos/cercanos?lat=-36.72&lng=-73.11&radio=500&solo_operativos=true
   */
  async findCercanos(lat: number, lng: number, radio = 1000, soloOperativos = true) {
    // PostGIS recibe [lng, lat] internamente
    const query = this.dataSource
      .createQueryBuilder(Grifo, 'g')
      .leftJoinAndSelect('g.compania', 'compania')
      .where(
        `ST_DWithin(
          g.coordenadas::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radio
        )`,
        { lat, lng, radio },
      )
      .addOrderBy(
        `ST_Distance(g.coordenadas::geography, ST_SetSRID(ST_MakePoint(:lng2, :lat2), 4326)::geography)`,
        'ASC',
      )
      .setParameter('lat2', lat)
      .setParameter('lng2', lng);

    if (soloOperativos) {
      query.andWhere('g.estado_operativo = :estado', { estado: EstadoGrifo.OPERATIVO });
    }

    const items = await query.getMany();
    return items.map((g) => ({ ...g, coordenadas: fromPostGIS(g.coordenadas) }));
  }

  async update(id: number, dto: UpdateGrifoDto) {
    const item = await this.repo.findOne({ where: { id_grifo: id } });
    if (!item) throw new NotFoundException(`Grifo con id ${id} no encontrado`);
    Object.assign(item, { ...dto, ...(dto.coordenadas && { coordenadas: toPostGIS(dto.coordenadas as any) }) });
    const saved = await this.repo.save(item);
    return { ...saved, coordenadas: fromPostGIS(saved.coordenadas) };
  }

  async remove(id: number) {
    const item = await this.repo.findOne({ where: { id_grifo: id } });
    if (!item) throw new NotFoundException(`Grifo con id ${id} no encontrado`);
    return this.repo.remove(item);
  }
}
