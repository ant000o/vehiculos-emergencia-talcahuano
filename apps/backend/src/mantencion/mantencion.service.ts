import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mantencion } from './entities/mantencion.entity';
import { Vehiculo } from '../vehiculo/entities/vehiculo.entity';
import { CreateMantencionDto } from './dto/create-mantencion.dto';
import { UpdateMantencionDto } from './dto/update-mantencion.dto';
import { EstadoMantencion, EstadoVehiculo } from '../common/enums/estados.enum';

@Injectable()
export class MantencionService {
  constructor(
    @InjectRepository(Mantencion)
    private readonly repo: Repository<Mantencion>,
    // Se inyecta para actualizar el estado del vehículo automáticamente
    // cuando la mantención se finaliza o cancela.
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
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

    const mantencionGuardada = await this.repo.save(item);

    // Cuando la mantención se finaliza o cancela, el vehículo vuelve a OPERATIVO
    // automáticamente. Así no es necesario actualizar el vehículo por separado.
    if (
      dto.estado_mantencion === EstadoMantencion.FINALIZADA ||
      dto.estado_mantencion === EstadoMantencion.CANCELADA
    ) {
      await this.vehiculoRepo.update(item.id_vehiculo, {
        estado_operativo: EstadoVehiculo.OPERATIVO,
      });
    }

    return mantencionGuardada;
  }

  async remove(id: number) {
    const item = await this.findOne(id);

    return this.repo.remove(item);
  }
}

