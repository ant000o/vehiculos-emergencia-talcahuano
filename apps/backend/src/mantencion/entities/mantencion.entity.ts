import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vehiculo } from '../../vehiculo/entities/vehiculo.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { DetalleArticuloMantencion } from '../../detalle_articulo_mantencion/entities/detalle_articulo_mantencion.entity';
import { MovimientoInventario } from '../../movimiento_inventario/entities/movimiento_inventario.entity';
import { EstadoMantencion } from '../../common/enums/estados.enum';

@Entity('mantencion')
export class Mantencion {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_mantencion: number;

  @Column({ type: 'varchar', length: 50 })
  tipo_mantencion: string;

  @Column({ type: 'timestamptz' })
  fecha_ingreso: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_salida: Date;

  @Column({ type: 'text', nullable: true })
  descripcion_falla: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  costo_mano_obra: number;

  @Column({ type: 'enum', enum: EstadoMantencion, default: EstadoMantencion.PENDIENTE })
  estado_mantencion: EstadoMantencion;

  @Column({ type: 'int' })
  id_vehiculo: number;

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.mantenciones, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_vehiculo' })
  vehiculo: Vehiculo;

  @Column({ type: 'int', nullable: true })
  id_usuario_mecanico: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.mantenciones_realizadas, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_usuario_mecanico' })
  usuarioMecanico: Usuario;

  @Column({ type: 'varchar', length: 150, nullable: true })
  taller_externo: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => DetalleArticuloMantencion, (d) => d.mantencion)
  detalles_articulos: DetalleArticuloMantencion[];

  @OneToMany(() => MovimientoInventario, (m) => m.mantencion)
  movimientos: MovimientoInventario[];
}
