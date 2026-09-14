import type { Usuario, RolOption, CompaniaOption } from '../../services/usuarios';

interface UsuariosTableProps {
  usuarios: Usuario[];
  roles: RolOption[];
  companias: CompaniaOption[];
  onEditar: (usuario: Usuario) => void;
  onCambiarEstado: (usuario: Usuario) => void;
}

export function UsuariosTable({
  usuarios,
  roles,
  companias,
  onEditar,
  onCambiarEstado,
}: UsuariosTableProps) {
  function nombreRol(id_rol: number): string {
    return roles.find((r) => r.id_rol === id_rol)?.nombre_rol ?? '—';
  }

  function nombreCompania(id_compania: number): string {
    return companias.find((c) => c.id_compania === id_compania)?.nombre ?? '—';
  }

  if (usuarios.length === 0) {
    return <p className="usuarios-table__empty">No hay usuarios registrados todavía.</p>;
  }

  return (
    <table className="usuarios-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>RUT</th>
          <th>Correo</th>
          <th>Rol</th>
          <th>Compañía</th>
          <th>Estado</th>
          <th aria-label="Acciones"></th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((u) => (
          <tr key={u.id_usuario}>
            <td>{u.nombre} {u.apellidos}</td>
            <td>{u.rut}</td>
            <td>{u.email}</td>
            <td>{nombreRol(u.id_rol)}</td>
            <td>{nombreCompania(u.id_compania)}</td>
            <td>
              <span
                className={
                  u.estado_activo
                    ? 'usuarios-table__badge is-active'
                    : 'usuarios-table__badge is-inactive'
                }
              >
                {u.estado_activo ? 'Activo' : 'Deshabilitado'}
              </span>
            </td>
            <td className="usuarios-table__actions">
              <button onClick={() => onEditar(u)}>Editar</button>
              <button onClick={() => onCambiarEstado(u)}>
                {u.estado_activo ? 'Deshabilitar' : 'Habilitar'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
