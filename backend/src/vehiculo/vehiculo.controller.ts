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
import { VehiculoService } from './vehiculo.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { EstadoVehiculo } from '../common/enums/estados.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehiculos')
export class VehiculoController {
  constructor(private readonly service: VehiculoService) {}

  @RequirePermission('vehiculos', 'create')
  @Post()
  async create(@Req() req: any, @Body() dto: CreateVehiculoDto) {
    if (req.rbacScope === 'COMPANY') {
      dto.id_compania = Number(req.user.id_compania);
    }
    return this.service.create(dto);
  }

  /** GET /vehiculos?estado=operativo&q=Mercedes&page=1&limit=20&id_compania=11 */
  @RequirePermission('vehiculos', 'view')
  @Get()
  findAll(
    @Req() req: any,
    @Query('estado') estado?: EstadoVehiculo,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('id_compania') idCompania?: string,
  ) {
    let cid: number | undefined;

    if (req.rbacScope === 'COMPANY') {
      // Alcance de compañía: forzado estrictamente desde el usuario autenticado
      cid = Number(req.user?.id_compania);
    } else {
      // Alcance GLOBAL: permite filtrar por compañía opcionalmente
      cid = idCompania ? +idCompania : undefined;
    }

    return this.service.findAll({
      estado,
      q,
      page: page ? +page : 1,
      limit: limit ? +limit : 50,
      id_compania: cid,
    });
  }

  /** GET /vehiculos/vista — consulta la vista_vehiculos */
  @RequirePermission('vehiculos', 'view')
  @Get('vista')
  findVista(@Req() req: any) {
    const idCompania = req.rbacScope === 'COMPANY' ? Number(req.user?.id_compania) : undefined;
    return this.service.findVistaVehiculos(idCompania);
  }

  @RequirePermission('vehiculos', 'view')
  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && item.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: el vehículo pertenece a otra compañía');
    }
    return item;
  }

  /** GET /vehiculos/:id/registros */
  @RequirePermission('vehiculos', 'view')
  @Get(':id/registros')
  async findRegistros(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && item.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: el vehículo pertenece a otra compañía');
    }
    return this.service.findRegistros(id);
  }

  /** GET /vehiculos/:id/mantenciones */
  @RequirePermission('vehiculos', 'view')
  @Get(':id/mantenciones')
  async findMantenciones(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && item.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: el vehículo pertenece a otra compañía');
    }
    return this.service.findMantenciones(id);
  }

  @RequirePermission('vehiculos', 'update')
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehiculoDto,
  ) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY') {
      if (item.id_compania !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('Acceso denegado: no puedes modificar vehículos de otra compañía');
      }
      if (dto.id_compania && Number(dto.id_compania) !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('No está permitido transferir vehículos a otra compañía');
      }
    }
    return this.service.update(id, dto);
  }

  @RequirePermission('vehiculos', 'delete')
  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && item.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: no puedes eliminar vehículos de otra compañía');
    }
    return this.service.remove(id);
  }
}
