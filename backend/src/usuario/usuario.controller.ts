import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly service: UsuarioService) {}

  @RequirePermission('usuarios', 'create')
  @Post()
  async create(@Req() req: any, @Body() dto: CreateUsuarioDto) {
    if (req.rbacScope === 'COMPANY') {
      dto.id_compania = Number(req.user?.id_compania);
    }
    return this.service.create(dto);
  }

  @RequirePermission('usuarios', 'view')
  @Get()
  findAll(@Req() req: any) {
    const userRole = (req.user?.nombre_rol || req.user?.rol || '').toLowerCase().trim();
    const esAdmin = userRole === 'administrador';
    const idCompania = req.rbacScope === 'COMPANY' ? Number(req.user?.id_compania) : undefined;

    return this.service.findAll({ esAdmin, id_compania: idCompania });
  }

  @RequirePermission('usuarios', 'view')
  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userRole = (req.user?.nombre_rol || req.user?.rol || '').toLowerCase().trim();
    const esAdmin = userRole === 'administrador';
    const usuario = await this.service.findOne(id, esAdmin);

    if (req.rbacScope === 'COMPANY' && usuario.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: el usuario pertenece a otra compañía');
    }
    return usuario;
  }

  @RequirePermission('usuarios', 'update')
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    const usuario = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY') {
      if (usuario.id_compania !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('Acceso denegado: no puedes modificar usuarios de otra compañía');
      }
      if (dto.id_compania && Number(dto.id_compania) !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('No está permitido transferir usuarios a otra compañía');
      }
    }
    return this.service.update(id, dto);
  }

  @RequirePermission('usuarios', 'delete')
  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const usuario = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && usuario.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: no puedes eliminar usuarios de otra compañía');
    }
    return this.service.remove(id);
  }
}
