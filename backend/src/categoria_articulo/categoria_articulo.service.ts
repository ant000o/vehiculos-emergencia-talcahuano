import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaArticulo } from './entities/categoria_articulo.entity';
import { CreateCategoriaArticuloDto } from './dto/create-categoria_articulo.dto';
import { UpdateCategoriaArticuloDto } from './dto/update-categoria_articulo.dto';

@Injectable()
export class CategoriaArticuloService {
  constructor(
    @InjectRepository(CategoriaArticulo)
    private readonly repo: Repository<CategoriaArticulo>,
  ) {}

  create(dto: CreateCategoriaArticuloDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id_categoria: id } });
    if (!item) throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    return item;
  }

  async update(id: number, dto: UpdateCategoriaArticuloDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    return this.repo.remove(item);
  }
}
