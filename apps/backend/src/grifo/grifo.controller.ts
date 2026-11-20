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
import { GrifoService } from './grifo.service';
import { CreateGrifoDto } from './dto/create-grifo.dto';
import { UpdateGrifoDto } from './dto/update-grifo.dto';
import { EstadoGrifo } from '../common/enums/estados.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grifos')
export class GrifoController {
  constructor(private readonly service: GrifoService) {}

  @RequirePermission('grifos', 'create')
  @Post()
  create(@Req() req: any, @Body() dto: CreateGrifoDto) {
    if (req.rbacScope === 'COMPANY') {
      dto.id_compania = Number(req.user?.id_compania);
    }
    return this.service.create(dto);
  }

  /** GET /grifos?estado=operativo&id_compania=11 */
  @RequirePermission('grifos', 'view')
  @Get()
  findAll(
    @Req() req: any,
    @Query('estado') estado?: EstadoGrifo,
    @Query('id_compania') idCompania?: string,
  ) {
    let cid: number | undefined;
    if (req.rbacScope === 'COMPANY') {
      cid = Number(req.user?.id_compania);
    } else {
      cid = idCompania ? Number(idCompania) : undefined;
    }
    return this.service.findAll(estado, cid);
  }

  /**
   * GET /grifos/cercanos?lat=-36.72&lng=-73.11&radio=1000&solo_operativos=true
   */
  @RequirePermission('grifos', 'view')
  @Get('cercanos')
  findCercanos(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radio') radio?: string,
    @Query('solo_operativos') soloOperativos?: string,
  ) {
    return this.service.findCercanos(
      Number(lat),
      Number(lng),
      radio ? Number(radio) : 1000,
      soloOperativos !== 'false',
    );
  }

  @RequirePermission('grifos', 'view')
  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const grifo = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && grifo.id_compania && grifo.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: el grifo pertenece a otra compañía');
    }
    return grifo;
  }

  @RequirePermission('grifos', 'update')
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGrifoDto,
  ) {
    const grifo = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY') {
      if (grifo.id_compania && grifo.id_compania !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('Acceso denegado: no puedes modificar grifos de otra compañía');
      }
      if (dto.id_compania && Number(dto.id_compania) !== Number(req.user?.id_compania)) {
        throw new ForbiddenException('No puedes reasignar grifos a otra compañía');
      }
    }
    return this.service.update(id, dto);
  }

  @RequirePermission('grifos', 'delete')
  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const grifo = await this.service.findOne(id);
    if (req.rbacScope === 'COMPANY' && grifo.id_compania && grifo.id_compania !== Number(req.user?.id_compania)) {
      throw new ForbiddenException('Acceso denegado: no puedes eliminar grifos de otra compañía');
    }
    return this.service.remove(id);
  }
}
