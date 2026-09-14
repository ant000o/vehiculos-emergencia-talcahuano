import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DespachoPersonal } from './entities/despacho_personal.entity';
import { CreateDespachoPersonalDto } from './dto/create-despacho_personal.dto';
import { UpdateDespachoPersonalDto } from './dto/update-despacho_personal.dto';

@Injectable()
export class DespachoPersonalService {
  constructor(
    @InjectRepository(DespachoPersonal)
    private readonly repo: Repository<DespachoPersonal>,
  ) {}

  create(dto: CreateDespachoPersonalDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({
      relations: {
        despacho: true,
        usuario: true,
      },
    });
  }

  findByDespacho(id_despacho: number) {
    return this.repo.find({
      where: { id_despacho },
      relations: {
        usuario: true,
      },
    });
  }

  async findOne(id_despacho: number, id_usuario: number) {
    const item = await this.repo.findOne({
      where: {
        id_despacho,
        id_usuario,
      },
      relations: {
        despacho: true,
        usuario: true,
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Registro de tripulación no encontrado',
      );
    }

    return item;
  }

  async update(
    id_despacho: number,
    id_usuario: number,
    dto: UpdateDespachoPersonalDto,
  ) {
    const item = await this.findOne(id_despacho, id_usuario);

    Object.assign(item, dto);

    return this.repo.save(item);
  }

  async remove(id_despacho: number, id_usuario: number) {
    const item = await this.findOne(id_despacho, id_usuario);

    return this.repo.remove(item);
  }
}
