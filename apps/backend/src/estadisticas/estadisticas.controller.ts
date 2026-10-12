import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EstadisticasService } from './estadisticas.service';

@UseGuards(JwtAuthGuard)
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly service: EstadisticasService) {}

  /** GET /estadisticas/dashboard — resumen general para la pantalla principal */
  @Get('dashboard')
  getDashboard() { return this.service.getDashboard(); }

  /** GET /estadisticas/mantenciones-por-mes */
  @Get('mantenciones-por-mes')
  getMantencionPorMes() { return this.service.getMantencionPorMes(); }

  /** GET /estadisticas/vehiculos-mas-mantenidos */
  @Get('vehiculos-mas-mantenidos')
  getVehiculosMasMantenidos() { return this.service.getVehiculosMasMantenidos(); }

  /** GET /estadisticas/stock-critico */
  @Get('stock-critico')
  getStockCritico() { return this.service.getStockCritico(); }

  /** GET /estadisticas/despachos-activos */
  @Get('despachos-activos')
  getDespachosActivos() { return this.service.getDespachosActivos(); }

  /** GET /estadisticas/tiempos-reparacion — ranking de días en taller (HU-24) */
  @Get('tiempos-reparacion')
  getTiemposReparacion() { return this.service.getTiemposReparacion(); }

  /** GET /estadisticas/alertas-mantencion — alertas de mantención preventiva (HU-15) */
  @Get('alertas-mantencion')
  getAlertasMantencion() { return this.service.getAlertasMantencion(); }
}
