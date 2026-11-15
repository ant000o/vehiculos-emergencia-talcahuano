import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ArticuloInventario } from '../../articulo_inventario/entities/articulo_inventario.entity';
import { Mantencion } from '../../mantencion/entities/mantencion.entity';
import { TipoMovimiento } from '../../common/enums/estados.enum';

// Tabla kardex: NO tiene updated_at en la BD (es un registro histórico inmutable).
@Entity('movimiento_inventario')
export class MovimientoInventario {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_movimiento: number;

  @Column({ type: 'enum', enum: TipoMovimiento })
  tipo_movimiento: TipoMovimiento;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'timestamptz' })
  fecha_movimiento: Date;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  @Column({ type: 'int' })
  id_articulo: number;

  @ManyToOne(() => ArticuloInventario, (articulo) => articulo.movimientos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_articulo' })
  articulo: ArticuloInventario;

  @Column({ type: 'int', nullable: true })
  id_mantencion: number;

  @ManyToOne(() => Mantencion, (mantencion) => mantencion.movimientos, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_mantencion' })
  mantencion: Mantencion;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
