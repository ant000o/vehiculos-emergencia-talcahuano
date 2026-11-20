import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DespachoEmergencia } from './despacho_emergencia.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

export type DecisionApoyo = 'voy' | 'no_voy';

// Respuesta de un bombero notificado (que no está en la tripulación) a un despacho:
// "voy a apoyar" o "no puedo ir". Una respuesta por usuario y despacho.
@Entity('despacho_respuesta')
export class DespachoRespuesta {
  @PrimaryColumn({ type: 'int' })
  id_despacho: number;

  @ManyToOne(() => DespachoEmergencia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_despacho' })
  despacho: DespachoEmergencia;

  @PrimaryColumn({ type: 'int' })
  id_usuario: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 10 })
  decision: DecisionApoyo;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha_respuesta: Date;
}