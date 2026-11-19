import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('rol')
export class Rol {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_rol: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  nombre_rol: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios: Usuario[];
}
