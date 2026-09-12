import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mantencion } from './entities/mantencion.entity';
import { CreateMantencionDto } from './dto/create-mantencion.dto';
import { UpdateMantencionDto } from './dto/update-mantencion.dto';

@Injectable()
export class MantencionService {
  constructor(
    @InjectRepository(Mantencion)
    private readonly repo: Repository<Mantencion>,
  ) {}

  create(dto: CreateMantencionDto) {
    if (!dto.id_usuario_mecanico && !dto.taller_externo) {
      throw new BadRequestException(
        'Debe indicar id_usuario_mecanico o taller_externo',
      );
    }

    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({
      relations: {
        vehiculo: true,
        usuarioMecanico: true,
      },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: {
        id_mantencion: id,
      },
      relations: {
        vehiculo: true,
        usuarioMecanico: true,
        detalles_articulos: true,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Mantención con id ${id} no encontrada`,
      );
    }

    return item;
  }

  async update(id: number, dto: UpdateMantencionDto) {
    const item = await this.findOne(id);

    Object.assign(item, dto);

    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);

    return this.repo.remove(item);
  }
}
