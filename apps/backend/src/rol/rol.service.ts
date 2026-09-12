import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  create(createRolDto: CreateRolDto) {
    const rol = this.rolRepository.create(createRolDto);
    return this.rolRepository.save(rol);
  }

  findAll() {
    return this.rolRepository.find();
  }

  async findOne(id: number) {
    const rol = await this.rolRepository.findOne({ where: { id_rol: id } });
    if (!rol) throw new NotFoundException(`Rol con id ${id} no encontrado`);
    return rol;
  }

  async update(id: number, updateRolDto: UpdateRolDto) {
    const rol = await this.findOne(id);
    Object.assign(rol, updateRolDto);
    return this.rolRepository.save(rol);
  }

  async remove(id: number) {
    const rol = await this.findOne(id);
    return this.rolRepository.remove(rol);
  }
}
