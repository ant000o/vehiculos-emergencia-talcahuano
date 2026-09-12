import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Rol } from '../../rol/entities/rol.entity';
import { Compania } from '../../compania/entities/compania.entity';
import { RegistroOperatividad } from '../../registro_operatividad/entities/registro_operatividad.entity';
import { Mantencion } from '../../mantencion/entities/mantencion.entity';
import { DespachoPersonal } from '../../despacho_personal/entities/despacho_personal.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn({ type: 'int' })
  id_usuario: number;

  @Column({ type: 'varchar', length: 12, unique: true })
  rut: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  // Nunca se expone en las respuestas. @Exclude() + ClassSerializerInterceptor
  // en main.ts lo omiten de cualquier respuesta JSON, incluyendo relaciones anidadas.
  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'int' })
  id_rol: number;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @Column({ type: 'int' })
  id_compania: number;

  @ManyToOne(() => Compania, (compania) => compania.usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_compania' })
  compania: Compania;

  @Column({ type: 'boolean', default: true })
  estado_activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => RegistroOperatividad, (r) => r.usuario)
  registros_operatividad: RegistroOperatividad[];

  @OneToMany(() => Mantencion, (m) => m.usuarioMecanico)
  mantenciones_realizadas: Mantencion[];

  @OneToMany(() => DespachoPersonal, (dp) => dp.usuario)
  despachos: DespachoPersonal[];
}
