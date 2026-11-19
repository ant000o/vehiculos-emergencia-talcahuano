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
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { MantencionService } from './mantencion.service';
import { CreateMantencionDto } from './dto/create-mantencion.dto';
import { UpdateMantencionDto } from './dto/update-mantencion.dto';
import { EstadoMantencion, TipoMantencion } from '../common/enums/estados.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mantenciones')
export class MantencionController {
  constructor(
    private readonly service: MantencionService,
  ) {}

  @RequirePermission('mantenciones', 'create')
  @Post()
  async create(@Req() req: any, @Body() dto: CreateMantencionDto) {
    if (!dto.id_usuario_mecanico && req.user?.sub) {
      dto.id_usuario_mecanico = Number(req.user.sub);
    }

    if (req.rbacScope === 'COMPANY') {
      const veh = await this.service.findVehiculo(dto.id_vehiculo);
      if (veh && veh.id_compania !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('Acceso denegado: no puedes crear mantenciones en vehículos de otra compañía');
      }
    }

    return this.service.create(dto);
  }

  /** GET /mantenciones?id_vehiculo=3&estado=en_proceso&tipo=correctiva */
  @RequirePermission('mantenciones', 'view')
  @Get()
  findAll(
    @Req() req: any,
    @Query('id_vehiculo') id_vehiculo?: string,
    @Query('estado') estado?: EstadoMantencion,
    @Query('tipo') tipo?: TipoMantencion,
  ) {
    const idCompania = req.rbacScope === 'COMPANY' ? Number(req.user?.id_compania) : undefined;
    return this.service.findAll({
      id_vehiculo: id_vehiculo ? +id_vehiculo : undefined,
      estado,
      tipo,
      id_compania: idCompania,
    });
  }

  @RequirePermission('mantenciones', 'view')
  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const mant = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && mant.vehiculo && mant.vehiculo.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: la mantención pertenece a un vehículo de otra compañía');
    }
    return mant;
  }

  @RequirePermission('mantenciones', 'update')
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMantencionDto,
  ) {
    const mant = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && mant.vehiculo && mant.vehiculo.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: no puedes modificar mantenciones de otra compañía');
    }
    return this.service.update(id, dto);
  }

  @RequirePermission('mantenciones', 'delete')
  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const mant = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && mant.vehiculo && mant.vehiculo.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: no puedes eliminar mantenciones de otra compañía');
    }
    return this.service.remove(id);
  }
}
