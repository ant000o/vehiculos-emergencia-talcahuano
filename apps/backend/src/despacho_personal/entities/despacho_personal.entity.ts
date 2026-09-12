import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { DespachoEmergencia } from '../../despacho_emergencia/entities/despacho_emergencia.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

// Tabla puente N:M entre despacho_emergencia y usuario (tripulación).
// PK compuesta (id_despacho, id_usuario) -> no tiene su propio id autogenerado.
@Entity('despacho_personal')
export class DespachoPersonal {
  @PrimaryColumn({ type: 'int' })
  id_despacho: number;

  @ManyToOne(() => DespachoEmergencia, (despacho) => despacho.tripulacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_despacho' })
  despacho: DespachoEmergencia;

  @PrimaryColumn({ type: 'int' })
  id_usuario: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.despachos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rol_en_despacho: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
