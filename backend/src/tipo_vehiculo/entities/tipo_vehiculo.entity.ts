import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vehiculo } from '../../vehiculo/entities/vehiculo.entity';

@Entity('tipo_vehiculo')
export class TipoVehiculo {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_tipo_vehiculo: number;

  @Column({ type: 'varchar', length: 80, unique: true })
  nombre_tipo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Vehiculo, (v) => v.tipoVehiculo)
  vehiculos: Vehiculo[];
}
