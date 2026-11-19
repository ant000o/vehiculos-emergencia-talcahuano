import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ArticuloInventario } from '../../articulo_inventario/entities/articulo_inventario.entity';

@Entity('categoria_articulo')
export class CategoriaArticulo {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_categoria: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre_categoria: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => ArticuloInventario, (articulo) => articulo.categoria)
  articulos: ArticuloInventario[];
}
