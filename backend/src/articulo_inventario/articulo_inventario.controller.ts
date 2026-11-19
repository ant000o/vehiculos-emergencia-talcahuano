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
import { ArticuloInventarioService } from './articulo_inventario.service';
import { CreateArticuloInventarioDto } from './dto/create-articulo_inventario.dto';
import { UpdateArticuloInventarioDto } from './dto/update-articulo_inventario.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('articulos-inventario')
export class ArticuloInventarioController {
  constructor(private readonly service: ArticuloInventarioService) {}

  @RequirePermission('inventario', 'create')
  @Post()
  create(@Req() req: any, @Body() dto: CreateArticuloInventarioDto) {
    if (req.rbacScope === 'COMPANY') {
      dto.id_compania = Number(req.user?.id_compania);
    }
    return this.service.create(dto);
  }

  @RequirePermission('inventario', 'view')
  @Get()
  findAll(@Req() req: any, @Query('id_compania') idCompania?: string) {
    let cid: number | undefined;
    if (req.rbacScope === 'COMPANY') {
      cid = Number(req.user?.id_compania);
    } else {
      cid = idCompania ? Number(idCompania) : undefined;
    }
    return this.service.findAll(cid);
  }

  @RequirePermission('inventario', 'view')
  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && item.id_compania && item.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: el artículo de inventario pertenece a otra compañía');
    }
    return item;
  }

  @RequirePermission('inventario', 'update')
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArticuloInventarioDto,
  ) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY') {
      if (item.id_compania && item.id_compania !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('Acceso denegado: no puedes modificar inventario de otra compañía');
      }
      if (dto.id_compania && Number(dto.id_compania) !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('No puedes reasignar artículos a otra compañía');
      }
    }
    return this.service.update(id, dto);
  }

  @RequirePermission('inventario', 'delete')
  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const item = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && item.id_compania && item.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: no puedes eliminar inventario de otra compañía');
    }
    return this.service.remove(id);
  }
}
