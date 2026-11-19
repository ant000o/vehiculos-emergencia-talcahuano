import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CategoriaArticulo } from '../../categoria_articulo/entities/categoria_articulo.entity';
import { Compania } from '../../compania/entities/compania.entity';
import { DetalleArticuloMantencion } from '../../detalle_articulo_mantencion/entities/detalle_articulo_mantencion.entity';
import { MovimientoInventario } from '../../movimiento_inventario/entities/movimiento_inventario.entity';

@Entity('articulo_inventario')
export class ArticuloInventario {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_articulo: number;

  @Column({ type: 'varchar', length: 150 })
  nombre_articulo: string;

  @Column({ type: 'int', default: 0 })
  stock_actual: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  costo_unitario_actual: number;

  @Column({ type: 'int' })
  id_categoria: number;

  @ManyToOne(() => CategoriaArticulo, (categoria) => categoria.articulos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_categoria' })
  categoria: CategoriaArticulo;

  @Column({ type: 'int', nullable: true })
  id_compania: number;

  @ManyToOne(() => Compania, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_compania' })
  compania: Compania;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => DetalleArticuloMantencion, (d) => d.articulo)
  detalles_mantencion: DetalleArticuloMantencion[];

  @OneToMany(() => MovimientoInventario, (m) => m.articulo)
  movimientos: MovimientoInventario[];
}