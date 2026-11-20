import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { MovimientoInventarioService } from './movimiento_inventario.service';
import { CreateMovimientoInventarioDto } from './dto/create-movimiento_inventario.dto';
import { ArticuloInventarioService } from '../articulo_inventario/articulo_inventario.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('movimientos-inventario')
export class MovimientoInventarioController {
  constructor(
    private readonly service: MovimientoInventarioService,
    private readonly articuloService: ArticuloInventarioService,
  ) {}

  @RequirePermission('inventario', 'create')
  @Post()
  async create(@Req() req: any, @Body() dto: CreateMovimientoInventarioDto) {
    if (!dto.id_usuario && req.user?.sub) {
      dto.id_usuario = req.user.sub;
    }

    if (req.rbacScope === 'COMPANY') {
      const art = await this.articuloService.findOne(dto.id_articulo);
      if (art && art.id_compania && art.id_compania !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('Acceso denegado: no puedes crear movimientos en artículos de otra compañía');
      }
    }

    return this.service.create(dto);
  }

  @RequirePermission('inventario', 'view')
  @Get()
  async findAll(@Req() req: any, @Query('id_articulo') id_articulo?: string) {
    if (id_articulo) {
      if (req.rbacScope === 'COMPANY') {
        const art = await this.articuloService.findOne(Number(id_articulo));
        if (art && art.id_compania && art.id_compania !== Number(req.user?.id_compania)) {
          throw new ForbiddenException('Acceso denegado: el artículo pertenece a otra compañía');
        }
      }
      return this.service.findByArticulo(Number(id_articulo));
    }
    return this.service.findAll();
  }

  @RequirePermission('inventario', 'view')
  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const mov = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && mov?.articulo?.id_compania && mov.articulo.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: el movimiento pertenece a otra compañía');
    }
    return mov;
  }
}
