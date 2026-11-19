import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from '../usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  private async getPermisosRol(idRol: number): Promise<{ permisos: string[]; alcances: Record<string, string> }> {
    if (!idRol) return { permisos: [], alcances: {} };
    try {
      const rows = await this.dataSource.query(
        `SELECT p.codigo, p.modulo, rp.alcance 
         FROM rol_permiso rp 
         JOIN permiso p ON p.id_permiso = rp.id_permiso 
         WHERE rp.id_rol = $1 AND p.activo = true`,
        [idRol],
      );
      const permisos: string[] = [];
      
      const alcances: Record<string, string> = {};
      for (const r of rows) {
        permisos.push(String(r.codigo).trim());
        const mod = String(r.modulo || '').toLowerCase().trim();
        const alc = String(r.alcance || '').toUpperCase().trim();
        if (mod && alc && alcances[mod] !== 'GLOBAL') {
          alcances[mod] = alc;
        }
      }
      return { permisos, alcances };
    } catch (err) {
      console.error('Error al consultar permisos de rol:', err);
      return { permisos: [], alcances: {} };
    }
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarioService.findByEmail(dto.email);

    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    if (!usuario.estado_activo) {
      throw new UnauthorizedException('El usuario está inactivo, contacta a un administrador');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.password_hash);
    if (!passwordValida) throw new UnauthorizedException('Credenciales inválidas');

    const nombreRol =
      (typeof usuario.rol === 'object' && usuario.rol !== null
        ? usuario.rol.nombre_rol
        : (usuario.rol as any)) || '';

    const payload: JwtPayload = {
      sub: usuario.id_usuario,
      email: usuario.email,
      id_rol: usuario.id_rol,
      nombre_rol: nombreRol,
      id_compania: usuario.id_compania,
    };

    const esAdmin = String(nombreRol).toLowerCase().trim() === 'administrador';
    let { permisos, alcances } = await this.getPermisosRol(usuario.id_rol);

    // Superadministrador: asegurar acceso a todos los códigos
    if (esAdmin) {
      const allPerms = await this.dataSource.query(`SELECT codigo, modulo FROM permiso WHERE activo = true`);
      permisos = allPerms.map((p: any) => p.codigo);
      allPerms.forEach((p: any) => { alcances[p.modulo] = 'GLOBAL'; });
    }

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: nombreRol,
        id_rol: usuario.id_rol,
        id_compania: usuario.id_compania,
        compania: usuario.compania?.nombre || '',
        permisos,
        alcances,
      },
    };
  }

  async getMe(userId: number) {
    const usuario = await this.usuarioService.findOne(userId);
    if (!usuario || !usuario.estado_activo) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }
    const nombreRol =
      (typeof usuario.rol === 'object' && usuario.rol !== null
        ? usuario.rol.nombre_rol
        : (usuario.rol as any)) || '';

    const esAdmin = String(nombreRol).toLowerCase().trim() === 'administrador';
    let { permisos, alcances } = await this.getPermisosRol(usuario.id_rol);

    if (esAdmin) {
      const allPerms = await this.dataSource.query(`SELECT codigo, modulo FROM permiso WHERE activo = true`);
      permisos = allPerms.map((p: any) => p.codigo);
      allPerms.forEach((p: any) => { alcances[p.modulo] = 'GLOBAL'; });
    }

    return {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: nombreRol,
      id_rol: usuario.id_rol,
      id_compania: usuario.id_compania,
      compania: usuario.compania?.nombre || '',
      permisos,
      alcances,
    };
  }
}
