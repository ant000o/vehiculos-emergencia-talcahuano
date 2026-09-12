import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleArticuloMantencion } from './entities/detalle_articulo_mantencion.entity';
import { ArticuloInventario } from '../articulo_inventario/entities/articulo_inventario.entity';
import { CreateDetalleArticuloMantencionDto } from './dto/create-detalle_articulo_mantencion.dto';
import { UpdateDetalleArticuloMantencionDto } from './dto/update-detalle_articulo_mantencion.dto';

@Injectable()
export class DetalleArticuloMantencionService {
  constructor(
    @InjectRepository(DetalleArticuloMantencion)
    private readonly repo: Repository<DetalleArticuloMantencion>,

    @InjectRepository(ArticuloInventario)
    private readonly articuloRepo: Repository<ArticuloInventario>,
  ) {}

  async create(dto: CreateDetalleArticuloMantencionDto) {
    // Nota: al insertar esta fila, un TRIGGER en la BD genera automáticamente
    // el movimiento_inventario de tipo 'salida' y descuenta stock_actual.

    let costo = dto.costo_unitario_historico;

    if (costo === undefined) {
      const articulo = await this.articuloRepo.findOne({
        where: {
          id_articulo: dto.id_articulo,
        },
      });

      if (!articulo) {
        throw new NotFoundException(
          `Artículo con id ${dto.id_articulo} no encontrado`,
        );
      }

      costo = Number(articulo.costo_unitario_actual);
    }

    const detalle = this.repo.create({
      ...dto,
      costo_unitario_historico: costo,
    });

    return this.repo.save(detalle);
  }

  findAll() {
    return this.repo.find({
      relations: {
        mantencion: true,
        articulo: true,
      },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: {
        id_detalle: id,
      },
      relations: {
        mantencion: true,
        articulo: true,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Detalle con id ${id} no encontrado`,
      );
    }

    return item;
  }

  async update(
    id: number,
    dto: UpdateDetalleArticuloMantencionDto,
  ) {
    const item = await this.findOne(id);

    Object.assign(item, dto);

    return this.repo.save(item);
  }

  async remove(id: number) {
    // OJO: esto NO revierte el stock automáticamente
    // (el trigger solo actúa en el INSERT).
    // Si necesitas revertir, crea un movimiento de 'entrada' manual.

    const item = await this.findOne(id);

    return this.repo.remove(item);
  }
}
