import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Vehiculo } from '../../vehiculo/entities/vehiculo.entity';
import { Grifo } from '../../grifo/entities/grifo.entity';
import { DespachoEmergencia } from '../../despacho_emergencia/entities/despacho_emergencia.entity';

@Entity('compania')
export class Compania {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_compania: number;

  @Column({ type: 'int', unique: true })
  numero_compania: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  // Punto geográfico (PostGIS). Se recibe/entrega como GeoJSON.
  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  ubicacion_geo: object;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Usuario, (usuario) => usuario.compania)
  usuarios: Usuario[];

  @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.compania)
  vehiculos: Vehiculo[];

  @OneToMany(() => Grifo, (grifo) => grifo.compania)
  grifos: Grifo[];

  @OneToMany(() => DespachoEmergencia, (despacho) => despacho.compania)
  despachos: DespachoEmergencia[];
}
