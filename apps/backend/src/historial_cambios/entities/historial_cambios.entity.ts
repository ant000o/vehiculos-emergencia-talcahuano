import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('historial_cambios')
export class HistorialCambios {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id_historial: number;

  @Column({ type: 'int', nullable: true })
  id_usuario: number;

  @Column({ type: 'int', nullable: true })
  id_compania: number;

  @Column({ type: 'varchar', length: 100 })
  tabla_afectada: string;

  @Column({ type: 'text' })
  id_registro: string;

  @Column({ type: 'varchar', length: 20 })
  accion: string;

  @Column({ type: 'jsonb', nullable: true })
  valores_anteriores: any;

  @Column({ type: 'jsonb', nullable: true })
  valores_nuevos: any;

  @CreateDateColumn({ name: 'fecha_hora', type: 'timestamptz' })
  fecha_hora: Date;
}
