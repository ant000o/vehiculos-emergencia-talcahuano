import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticuloInventario } from './entities/articulo_inventario.entity';
import { CreateArticuloInventarioDto } from './dto/create-articulo_inventario.dto';
import { UpdateArticuloInventarioDto } from './dto/update-articulo_inventario.dto';

@Injectable()
export class ArticuloInventarioService {
  constructor(
    @InjectRepository(ArticuloInventario)
    private readonly repo: Repository<ArticuloInventario>,
  ) { }

  create(dto: CreateArticuloInventarioDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({
      relations: {
        categoria: true,
      },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id_articulo: id },
      relations: {
        categoria: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Artículo con id ${id} no encontrado`);
    }

    return item;
  }

  async update(id: number, dto: UpdateArticuloInventarioDto) {
    const item = await this.findOne(id);

    Object.assign(item, dto);

    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);

    return this.repo.remove(item);
  }
}
