import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from '../usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.usuarioService.findByEmail(dto.email);

    // Mensaje genérico a propósito: no revelar si fue el email o la
    // contraseña la que falló (evita que alguien "adivine" emails válidos).
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    if (!usuario.estado_activo) {
      throw new UnauthorizedException('El usuario está inactivo, contacta a un administrador');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.password_hash);
    if (!passwordValida) throw new UnauthorizedException('Credenciales inválidas');

    const payload: JwtPayload = {
      sub: usuario.id_usuario,
      email: usuario.email,
      id_rol: usuario.id_rol,
      nombre_rol: usuario.rol.nombre_rol,
      id_compania: usuario.id_compania,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol.nombre_rol,
        compania: usuario.compania.nombre,
      },
    };
  }
}
