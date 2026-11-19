import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolPermisoService, ModuloPermisosInput } from './rol_permiso.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles-permisos')
export class RolPermisoController {
  constructor(private readonly service: RolPermisoService) {}

  /** GET /roles-permisos — vista completa de roles × permisos */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** GET /roles-permisos/:idRol — permisos de un rol */
  @Get(':idRol')
  findByRol(@Param('idRol', ParseIntPipe) idRol: number) {
    return this.service.findByRol(idRol);
  }

  /** POST /roles-permisos/toggle — activa o desactiva un permiso para un rol */
  @Roles('administrador')
  @Post('toggle')
  toggle(@Body() body: { id_rol: number; id_permiso: number; alcance?: string }) {
    return this.service.toggle(body.id_rol, body.id_permiso, body.alcance);
  }

  /** POST /roles-permisos/matriz/:idRol — guarda la configuración completa de la matriz para un rol */
  @Roles('administrador')
  @Post('matriz/:idRol')
  guardarMatriz(
    @Param('idRol', ParseIntPipe) idRol: number,
    @Body() body: { modulos: ModuloPermisosInput[] },
  ) {
    return this.service.guardarMatriz(idRol, body.modulos);
  }

  /** POST /roles-permisos/restablecer/:idRol — restablece la configuración predeterminada del rol */
  @Roles('administrador')
  @Post('restablecer/:idRol')
  restablecerPredeterminados(@Param('idRol', ParseIntPipe) idRol: number) {
    return this.service.restablecerPredeterminados(idRol);
  }
}
