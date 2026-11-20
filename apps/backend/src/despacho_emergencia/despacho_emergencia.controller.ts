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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { DespachoEmergenciaService } from './despacho_emergencia.service';
import { CreateDespachoEmergenciaDto } from './dto/create-despacho_emergencia.dto';
import { UpdateDespachoEmergenciaDto } from './dto/update-despacho_emergencia.dto';
import { ResponderDespachoDto } from './dto/responder-despacho.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['despachos-emergencia', 'despacho-emergencia'])
export class DespachoEmergenciaController {
  constructor(private readonly service: DespachoEmergenciaService) {}

  @RequirePermission('despachos', 'create')
  @Post()
  create(@Req() req: any, @Body() dto: CreateDespachoEmergenciaDto) {
    return this.service.create(dto, req.user, req.rbacScope);
  }

  @RequirePermission('despachos', 'view')
  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.rbacScope, req.user);
  }

  @RequirePermission('despachos', 'view')
  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, req.rbacScope, req.user);
  }

  @RequirePermission('despachos', 'update')
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDespachoEmergenciaDto,
  ) {
    return this.service.update(id, dto, req.rbacScope, req.user);
  }

  // Cualquier usuario autenticado (no mecánico) puede responder "voy / no voy",
  // aunque no esté en la tripulación; por eso no lleva @RequirePermission.
  @Post(':id/respuesta')
  responder(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResponderDespachoDto,
  ) {
    return this.service.responder(id, dto, req.user);
  }

  @RequirePermission('despachos', 'view')
  @Get(':id/respuestas')
  respuestas(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.listarRespuestas(id, req.rbacScope, req.user);
  }

  @RequirePermission('despachos', 'delete')
  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, req.rbacScope, req.user);
  }
}