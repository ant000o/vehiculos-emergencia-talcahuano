import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { HistorialCambiosService } from './historial_cambios.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('historial-cambios')
export class HistorialCambiosController {
  constructor(private readonly service: HistorialCambiosService) {}

  /** GET /historial-cambios?tabla=vehiculo&limit=50 */
  @Roles('administrador', 'capitan', 'director', 'comandante')
  @Get()
  findAll(
    @Query('tabla') tabla?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({ tabla, limit: limit ? +limit : 50 });
  }
}
