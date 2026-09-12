import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimientoInventario } from './entities/movimiento_inventario.entity';
import { CreateMovimientoInventarioDto } from './dto/create-movimiento_inventario.dto';

@Injectable()
export class MovimientoInventarioService {
  constructor(
    @InjectRepository(MovimientoInventario)
    private readonly repo: Repository<MovimientoInventario>,
  ) {}

  create(dto: CreateMovimientoInventarioDto) {
    // El trigger aplicar_movimiento_inventario() en la BD ajusta stock_actual
    // automáticamente al insertar esta fila (entrada suma, salida resta).

    const movimiento = this.repo.create({
      ...dto,
      fecha_movimiento: new Date(),
    });

    return this.repo.save(movimiento);
  }

  findAll() {
    return this.repo.find({
      relations: {
        articulo: true,
        mantencion: true,
      },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: {
        id_movimiento: id,
      },
      relations: {
        articulo: true,
        mantencion: true,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Movimiento con id ${id} no encontrado`,
      );
    }

    return item;
  }

  findByArticulo(id_articulo: number) {
    return this.repo.find({
      where: {
        id_articulo,
      },
      order: {
        fecha_movimiento: 'DESC',
      },
    });
  }
}
