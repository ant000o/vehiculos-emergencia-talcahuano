import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Compania } from '../../compania/entities/compania.entity';
import { DespachoEmergencia } from '../../despacho_emergencia/entities/despacho_emergencia.entity';
import { EstadoGrifo } from '../../common/enums/estados.enum';

@Entity('grifo')
export class Grifo {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_grifo: number;

  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  coordenadas: object;

  @Column({ type: 'varchar', length: 200, nullable: true })
  direccion: string;

  @Column({ type: 'enum', enum: EstadoGrifo, default: EstadoGrifo.OPERATIVO })
  estado_operativo: EstadoGrifo;

  @Column({ type: 'date', nullable: true })
  ultima_revision: string;

  @Column({ type: 'int' })
  id_compania: number;

  @ManyToOne(() => Compania, (compania) => compania.grifos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_compania' })
  compania: Compania;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => DespachoEmergencia, (d) => d.grifo)
  despachos: DespachoEmergencia[];
}
