import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vehiculo } from '../../vehiculo/entities/vehiculo.entity';
import { Grifo } from '../../grifo/entities/grifo.entity';
import { Compania } from '../../compania/entities/compania.entity';
import { DespachoPersonal } from '../../despacho_personal/entities/despacho_personal.entity';
import { EstadoEmergencia } from '../../common/enums/estados.enum';

@Entity('despacho_emergencia')
export class DespachoEmergencia {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_despacho: number;

  @Column({ type: 'timestamptz' })
  fecha_hora_despacho: Date;

  // Coordenada del lugar de la emergencia.
  // Formato: GeoJSON { type: 'Point', coordinates: [longitud, latitud] }
  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  coordenada_destino: object;

  @Column({ type: 'varchar', length: 80 })
  tipo_emergencia: string;

  @Column({ type: 'enum', enum: EstadoEmergencia, default: EstadoEmergencia.EN_CURSO })
  estado_emergencia: EstadoEmergencia;

  @Column({ type: 'int' })
  id_vehiculo: number;

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.despachos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_vehiculo' })
  vehiculo: Vehiculo;

  @Column({ type: 'int', nullable: true })
  id_grifo: number;

  @ManyToOne(() => Grifo, (grifo) => grifo.despachos, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_grifo' })
  grifo: Grifo;

  @Column({ type: 'int' })
  id_compania: number;

  @ManyToOne(() => Compania, (compania) => compania.despachos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_compania' })
  compania: Compania;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => DespachoPersonal, (dp) => dp.despacho)
  tripulacion: DespachoPersonal[];
}
