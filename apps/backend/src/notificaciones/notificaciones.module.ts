import { Global, Module } from '@nestjs/common';
import { NotificacionesGateway } from './notificaciones.gateway';

// @Global() permite que el Gateway est disponible para cualquier Service
// sin necesidad de importarlo en todos los sub-mdulos.
@Global()
@Module({
  providers: [NotificacionesGateway],
  exports: [NotificacionesGateway],
})
export class NotificacionesModule {}
