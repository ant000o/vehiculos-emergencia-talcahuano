import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { EstadisticasService } from './estadisticas.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly service: EstadisticasService) {}

  private extractCompany(req: any): number | undefined {
    return req.rbacScope === 'COMPANY' && req.user?.id_compania
      ? Number(req.user.id_compania)
      : undefined;
  }

  /** GET /estadisticas/dashboard — resumen general para la pantalla principal */
  @RequirePermission('dashboard', 'view')
  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.service.getDashboard(this.extractCompany(req));
  }

  /** GET /estadisticas/mantenciones-por-mes */
  @RequirePermission('dashboard', 'view')
  @Get('mantenciones-por-mes')
  getMantencionPorMes(@Req() req: any) {
    return this.service.getMantencionPorMes(this.extractCompany(req));
  }

  /** GET /estadisticas/vehiculos-mas-mantenidos */
  @RequirePermission('dashboard', 'view')
  @Get('vehiculos-mas-mantenidos')
  getVehiculosMasMantenidos(@Req() req: any) {
    return this.service.getVehiculosMasMantenidos(this.extractCompany(req));
  }

  /** GET /estadisticas/stock-critico */
  @RequirePermission('dashboard', 'view')
  @Get('stock-critico')
  getStockCritico(@Req() req: any) {
    return this.service.getStockCritico(this.extractCompany(req));
  }

  /** GET /estadisticas/despachos-activos */
  @RequirePermission('dashboard', 'view')
  @Get('despachos-activos')
  getDespachosActivos(@Req() req: any) {
    return this.service.getDespachosActivos(this.extractCompany(req));
  }

  /** GET /estadisticas/tiempos-reparacion — ranking de días en taller (HU-24) */
  @RequirePermission('dashboard', 'view')
  @Get('tiempos-reparacion')
  getTiemposReparacion(@Req() req: any) {
    return this.service.getTiemposReparacion(this.extractCompany(req));
  }

  /** GET /estadisticas/alertas-mantencion — alertas de mantención preventiva (HU-15) */
  @RequirePermission('dashboard', 'view')
  @Get('alertas-mantencion')
  getAlertasMantencion(@Req() req: any) {
    return this.service.getAlertasMantencion(this.extractCompany(req));
  }

  /** GET /estadisticas/kpis-operativos - KPIs operativos en tiempo real */
  @RequirePermission('dashboard', 'view')
  @Get('kpis-operativos')
  getKpisOperativos(@Req() req: any) {
    return this.service.getKpisOperativos(this.extractCompany(req));
  }
  /** GET /estadisticas/kpis-inicio - KPIs operativos para la pantalla Inicio */
  @RequirePermission('inicio', 'view')
  @Get('kpis-inicio')
  getKpisInicio(@Req() req: any) {
    return this.service.getKpisOperativos(this.extractCompany(req));
  }
}
