import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificacionesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[WebSocket] Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Cliente desconectado: ${client.id}`);
  }

  /**
   * HU-20 / HU-21: Notificar a mobile (y web) que hay un nuevo despacho.
   */
  emitNuevoDespacho(despacho: any) {
    this.server.emit('nuevo_despacho', despacho);
  }

  /**
   * HU-16: Notificar a central/oficial de una falla grave.
   */
  emitAlertaFallaGrave(vehiculo: any, observaciones: string = 'Vehículo reportado como Fuera de Servicio') {
    this.server.emit('alerta_falla_grave', { vehiculo, observaciones });
  }

  /**
   * HU-15: Notificar mantención próxima.
   */
  emitMantencionProxima(vehiculo: any, mensaje: string) {
    this.server.emit('alerta_mantencion', { vehiculo, mensaje });
  }
}
