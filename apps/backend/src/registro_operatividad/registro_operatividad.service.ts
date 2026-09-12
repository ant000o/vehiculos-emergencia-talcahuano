import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroOperatividad } from './entities/registro_operatividad.entity';
import { CreateRegistroOperatividadDto } from './dto/create-registro_operatividad.dto';
import { UpdateRegistroOperatividadDto } from './dto/update-registro_operatividad.dto';

@Injectable()
export class RegistroOperatividadService {
  constructor(
    @InjectRepository(RegistroOperatividad)
    private readonly repo: Repository<RegistroOperatividad>,
  ) {}

  create(dto: CreateRegistroOperatividadDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({
      relations: {
        usuario: true,
        vehiculo: true,
      },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: {
        id_registro: id,
      },
      relations: {
        usuario: true,
        vehiculo: true,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Registro con id ${id} no encontrado`,
      );
    }

    return item;
  }

  async update(id: number, dto: UpdateRegistroOperatividadDto) {
    const item = await this.findOne(id);

    Object.assign(item, dto);

    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);

    return this.repo.remove(item);
  }
}
