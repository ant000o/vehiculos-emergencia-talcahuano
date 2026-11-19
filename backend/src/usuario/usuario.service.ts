import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
    const { password, ...rest } = dto;
    const password_hash = await bcrypt.hash(password, 10);
    const usuario = this.repo.create({ ...rest, password_hash });
    const guardado = await this.repo.save(usuario);
    return this.findOne(guardado.id_usuario);
  }

  async findAll(opts: { esAdmin?: boolean; id_compania?: number } = {}) {
    const { esAdmin = true, id_compania } = opts;
    const where: any = {};
    if (id_compania) {
      where.id_compania = id_compania;
    }

    const usuarios = await this.repo.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: {
        rol: true,
        compania: true,
      },
      order: { id_usuario: 'ASC' },
    });

    if (!esAdmin) {
      return usuarios.map((u) => {
        const { rut: _rut, ...sinRut } = u;
        return sinRut;
      });
    }

    return usuarios;
  }

  async findOne(id: number, esAdmin = true) {
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

    if (!esAdmin) {
      const { rut: _rut, ...sinRut } = usuario;
      return sinRut as Usuario;
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

    // Si se envía una nueva contraseña, la hasheamos antes de guardar
    if ((dto as any).password) {
      const password_hash = await bcrypt.hash((dto as any).password, 10);
      const { password: _password, ...rest } = dto as any;
      Object.assign(usuario, { ...rest, password_hash });
    } else {
      Object.assign(usuario, dto);
    }

    await this.repo.save(usuario);
    return this.findOne(id);
  }

  async remove(id: number) {
    const usuario = await this.findOne(id);

    return this.repo.remove(usuario);
  }
}
