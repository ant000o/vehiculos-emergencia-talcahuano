import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Vehiculo } from '../../vehiculo/entities/vehiculo.entity';

@Entity('registro_operatividad')
export class RegistroOperatividad {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_registro: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha_hora_registro: Date;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  nivel_combustible: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  nivel_agua: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  nivel_aceite: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'int' })
  id_usuario: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.registros_operatividad, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ type: 'int' })
  id_vehiculo: number;

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.registros_operatividad, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_vehiculo' })
  vehiculo: Vehiculo;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
