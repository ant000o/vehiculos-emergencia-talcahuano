import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificacionesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Obtener token desde auth payload o headers
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.warn(`[WebSocket] Conexión rechazada: Sin token (${client.id})`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      (client as any).user = payload;
      console.log(`[WebSocket] Cliente autenticado: ${payload.email} (${client.id})`);
    } catch {
      console.warn(`[WebSocket] Conexión rechazada: Token inválido (${client.id})`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Cliente desconectado: ${client.id}`);
  }

  /**
   * Sanitiza objetos antes de difundir por WebSocket (S1: evita filtrar password_hash)
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const clean = JSON.parse(JSON.stringify(data));

    const removePasswordHash = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if ('password_hash' in obj) {
        delete obj.password_hash;
      }
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
          removePasswordHash(obj[key]);
        }
      }
    };

    removePasswordHash(clean);
    return clean;
  }

  /**
   * HU-20 / HU-21: Notificar a mobile y web de un nuevo despacho.
   */
  emitNuevoDespacho(despacho: any) {
    const payload = this.sanitizeData(despacho);
    this.server.emit('nuevo_despacho', payload);
  }

  /**
   * HU-16: Notificar a central/oficial de una falla grave.
   */
  emitAlertaFallaGrave(vehiculo: any, observaciones: string = 'Vehículo reportado como Fuera de Servicio') {
    const payload = this.sanitizeData(vehiculo);
    this.server.emit('alerta_falla_grave', { vehiculo: payload, observaciones });
  }

  /**
   * HU-15: Notificar mantención próxima.
   */
  emitMantencionProxima(vehiculo: any, mensaje: string) {
    const payload = this.sanitizeData(vehiculo);
    this.server.emit('alerta_mantencion', { vehiculo: payload, mensaje });
  }
}
