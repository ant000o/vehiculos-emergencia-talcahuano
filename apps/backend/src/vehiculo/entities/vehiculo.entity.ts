import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Compania } from '../../compania/entities/compania.entity';
import { RegistroOperatividad } from '../../registro_operatividad/entities/registro_operatividad.entity';
import { Mantencion } from '../../mantencion/entities/mantencion.entity';
import { DespachoEmergencia } from '../../despacho_emergencia/entities/despacho_emergencia.entity';
import { EstadoVehiculo } from '../../common/enums/estados.enum';

@Entity('vehiculo')
export class Vehiculo {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_vehiculo: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  patente: string;

  @Column({ type: 'varchar', length: 80 })
  marca: string;

  @Column({ type: 'varchar', length: 80 })
  modelo: string;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'bigint' })
  kilometraje: number;

  @Column({ type: 'enum', enum: EstadoVehiculo, default: EstadoVehiculo.OPERATIVO })
  estado_operativo: EstadoVehiculo;

  @Column({ type: 'int' })
  id_compania: number;

  @ManyToOne(() => Compania, (compania) => compania.vehiculos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_compania' })
  compania: Compania;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => RegistroOperatividad, (r) => r.vehiculo)
  registros_operatividad: RegistroOperatividad[];

  @OneToMany(() => Mantencion, (m) => m.vehiculo)
  mantenciones: Mantencion[];

  @OneToMany(() => DespachoEmergencia, (d) => d.vehiculo)
  despachos: DespachoEmergencia[];
}
