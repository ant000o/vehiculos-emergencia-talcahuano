import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Mantencion } from '../../mantencion/entities/mantencion.entity';
import { ArticuloInventario } from '../../articulo_inventario/entities/articulo_inventario.entity';

@Entity('detalle_articulo_mantencion')
export class DetalleArticuloMantencion {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_detalle: number;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  costo_unitario_historico: number;

  @Column({ type: 'int' })
  id_mantencion: number;

  @ManyToOne(() => Mantencion, (mantencion) => mantencion.detalles_articulos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_mantencion' })
  mantencion: Mantencion;

  @Column({ type: 'int' })
  id_articulo: number;

  @ManyToOne(() => ArticuloInventario, (articulo) => articulo.detalles_mantencion, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_articulo' })
  articulo: ArticuloInventario;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
