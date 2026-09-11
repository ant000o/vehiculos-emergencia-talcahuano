import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('usuario') // El nombre debe coincidir exactamente con la tabla en PostgreSQL
export class Usuario {
    @PrimaryGeneratedColumn()
    id_usuario: number;

    @Column({type: 'varchar', length:12, unique: true})
    rut: string;

    @Column({type: 'varchar', length: 100})
    nombre: string;

    @Column({type: 'varchar', length:100})
    apellidos: string;

    @Column({type: 'varchar', length:150, unique: true})
    email: string;

    @Column({type: 'varchar', length:255})
    password_hash: string;

    @Column({type:'int'})
    id_rol: number;

    @Column({type: 'int'})
    id_compañia: number;

    @Column({type: 'int'})
    estado_activo: boolean;
}