import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
  ) {}

  async create(dto: CreateUsuarioDto) {
    // NOTA: por ahora se guarda sin hashear para poder probar el CRUD ya.
    // En el paso de autenticación esto se reemplaza por bcrypt.hash(dto.password, 10).

    const { password, ...rest } = dto;

    const usuario = this.repo.create({
      ...rest,
      password_hash: password,
    });

    return this.repo.save(usuario);
  }

  findAll() {
    return this.repo.find({
      relations: {
        rol: true,
        compania: true,
      },
    });
  }

  async findOne(id: number) {
    const usuario = await this.repo.findOne({
      where: {
        id_usuario: id,
      },
      relations: {
        rol: true,
        compania: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(
        `Usuario con id ${id} no encontrado`,
      );
    }

    return usuario;
  }

  async findByEmail(email: string) {
    return this.repo.findOne({
      where: {
        email,
      },
      relations: {
        rol: true,
        compania: true,
      },
    });
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    const usuario = await this.findOne(id);

    Object.assign(usuario, dto);

    return this.repo.save(usuario);
  }

  async remove(id: number) {
    const usuario = await this.findOne(id);

    return this.repo.remove(usuario);
  }
}
