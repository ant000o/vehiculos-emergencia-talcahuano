import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { Rol } from '../../rol/entities/rol.entity';
import { Permiso } from '../../permiso/entities/permiso.entity';

@Entity('rol_permiso')
export class RolPermiso {
  @PrimaryColumn({ type: 'int' })
  id_rol: number;

  @PrimaryColumn({ type: 'int' })
  id_permiso: number;

  @Column({ type: 'varchar', length: 30, default: 'propia_compania' })
  alcance: string;

  @Column({ type: 'int', nullable: true })
  id_usuario_asignacion: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @ManyToOne(() => Permiso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_permiso' })
  permiso: Permiso;
}
