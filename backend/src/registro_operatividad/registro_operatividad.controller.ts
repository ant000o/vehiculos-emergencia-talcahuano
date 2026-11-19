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
import { RegistroOperatividadService } from './registro_operatividad.service';
import { CreateRegistroOperatividadDto } from './dto/create-registro_operatividad.dto';
import { UpdateRegistroOperatividadDto } from './dto/update-registro_operatividad.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registros-operatividad')
export class RegistroOperatividadController {
  constructor(private readonly service: RegistroOperatividadService) {}

  @RequirePermission('operatividad', 'create')
  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateRegistroOperatividadDto,
  ) {
    dto.id_usuario = req.user.sub;

    if (req.rbacScope === 'COMPANY') {
      const veh = await this.service.findVehiculo(dto.id_vehiculo);
      if (veh && veh.id_compania !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('Acceso denegado: no puedes registrar operatividad para vehículos de otra compañía');
      }
    }

    return this.service.create(dto);
  }

  /** GET /registros-operatividad?id_vehiculo=2 */
  @RequirePermission('operatividad', 'view')
  @Get()
  findAll(@Req() req: any, @Query('id_vehiculo') id_vehiculo?: string) {
    const idCompania = req.rbacScope === 'COMPANY' ? Number(req.user?.id_compania) : undefined;
    return this.service.findAll({
      id_vehiculo: id_vehiculo ? +id_vehiculo : undefined,
      id_compania: idCompania,
    });
  }

  @RequirePermission('operatividad', 'view')
  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && item.vehiculo && item.vehiculo.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: el registro de operatividad pertenece a otra compañía');
    }
    return item;
  }

  @RequirePermission('operatividad', 'update')
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRegistroOperatividadDto,
  ) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && item.vehiculo && item.vehiculo.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: no puedes modificar registros de operatividad de otra compañía');
    }
    return this.service.update(id, dto);
  }

  @RequirePermission('operatividad', 'delete')
  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && item.vehiculo && item.vehiculo.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: no puedes eliminar registros de operatividad de otra compañía');
    }
    return this.service.remove(id);
  }
}
