import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { DespachoPersonalService } from './despacho_personal.service';
import { CreateDespachoPersonalDto } from './dto/create-despacho_personal.dto';
import { UpdateDespachoPersonalDto } from './dto/update-despacho_personal.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('despacho-personal')
export class DespachoPersonalController {
  constructor(private readonly service: DespachoPersonalService) {}

  @RequirePermission('despachos', 'create')
  @Post()
  create(@Body() dto: CreateDespachoPersonalDto) {
    return this.service.create(dto);
  }

  @RequirePermission('despachos', 'view')
  @Get()
  findAll(@Query('id_despacho') id_despacho?: string) {
    if (id_despacho) return this.service.findByDespacho(Number(id_despacho));
    return this.service.findAll();
  }

  @RequirePermission('despachos', 'view')
  @Get(':id_despacho/:id_usuario')
  findOne(
    @Param('id_despacho', ParseIntPipe) id_despacho: number,
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
  ) {
    return this.service.findOne(id_despacho, id_usuario);
  }

  @RequirePermission('despachos', 'update')
  @Patch(':id_despacho/:id_usuario')
  update(
    @Param('id_despacho', ParseIntPipe) id_despacho: number,
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
    @Body() dto: UpdateDespachoPersonalDto,
  ) {
    return this.service.update(id_despacho, id_usuario, dto);
  }

  @RequirePermission('despachos', 'delete')
  @Delete(':id_despacho/:id_usuario')
  remove(
    @Param('id_despacho', ParseIntPipe) id_despacho: number,
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
  ) {
    return this.service.remove(id_despacho, id_usuario);
  }
}
