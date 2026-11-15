import type { Usuario, RolOption, CompaniaOption } from '../../services/usuarios';
import { ROLE_LABELS } from '../../config/navigation';
import type { Rol } from '../../services/auth';

interface UsuariosTableProps {
  usuarios: Usuario[];
  roles: RolOption[];
  companias: CompaniaOption[];
  esAdmin?: boolean;
  onEditar?: (usuario: Usuario) => void;
  onCambiarEstado?: (usuario: Usuario) => void;
}

export function UsuariosTable({
  usuarios,
  roles,
  companias,
  esAdmin = true,
  onEditar,
  onCambiarEstado,
}: UsuariosTableProps) {
  function nombreRol(id_rol: number): string {
    const rawRol = roles.find((r) => r.id_rol === id_rol)?.nombre_rol;
    if (!rawRol) return '—';
    return ROLE_LABELS[rawRol as Rol] ?? (rawRol.charAt(0).toUpperCase() + rawRol.slice(1));
  }

  function nombreCompania(id_compania: number): string {
    return companias.find((c) => c.id_compania === id_compania)?.nombre ?? '—';
  }

  if (usuarios.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ink-500)', background: 'var(--color-white)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)' }}>
        <p style={{ margin: 0, fontWeight: 500 }}>No se encontraron usuarios con los criterios de búsqueda seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Nombre</th>
            {esAdmin && <th>RUT</th>}
            <th>Correo</th>
            <th>Cargo / Rol</th>
            <th>Compañía</th>
            <th>Estado</th>
            {esAdmin && <th aria-label="Acciones"></th>}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id_usuario}>
              <td><strong>{u.nombre} {u.apellidos}</strong></td>
              {esAdmin && <td style={{ whiteSpace: 'nowrap' }}>{u.rut}</td>}
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
              {esAdmin && (
                <td className="usuarios-table__actions">
                  {onEditar && <button onClick={() => onEditar(u)}>Editar</button>}
                  {onCambiarEstado && (
                    <button onClick={() => onCambiarEstado(u)}>
                      {u.estado_activo ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
