import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarUsuarios,
  listarRoles,
  listarCompanias,
  crearUsuario,
  editarUsuario,
  cambiarEstadoUsuario,
  formatoNombreCompania,
  type Usuario,
  type RolOption,
  type CompaniaOption,
} from '../../services/usuarios';
import { UsuariosTable } from './UsuariosTable';
import { UsuarioForm } from './UsuarioForm';
import './usuarios.css';

type Vista = { modo: 'lista' } | { modo: 'crear' } | { modo: 'editar'; usuario: Usuario };

export function UsuariosPage() {
  const { user } = useAuth();
  const esAdmin = user?.rol === 'administrador';

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [vista, setVista] = useState<Vista>({ modo: 'lista' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filtros: Búsqueda por RUT, nombre o compañía, y estado (activo/inactivo)
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [idCompania, setIdCompania] = useState<string>('todas');

  // Carga inicial: usuarios + catálogos de roles y compañías para los <select>.
  useEffect(() => {
    async function cargarDatos() {
      try {
        const [listaUsuarios, listaRoles, listaCompanias] = await Promise.all([
          listarUsuarios(),
          listarRoles(),
          listarCompanias(),
        ]);
        setUsuarios(listaUsuarios);
        setRoles(listaRoles);
        setCompanias(listaCompanias);
      } catch (err) {
        // F15: antes, si alguna de las 3 llamadas fallaba, la página se
        // quedaba en "Cargando usuarios…" para siempre.
        setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.');
      } finally {
        setIsLoading(false);
      }
    }
    cargarDatos();
  }, []);

  async function handleCrear(values: {
    rut: string;
    nombre: string;
    apellidos: string;
    email: string;
    password: string;
    id_rol: number;
    id_compania: number;
  }) {
    setIsSaving(true);
    setFormError(null);
    try {
      const nuevo = await crearUsuario(values);
      setUsuarios((prev) => [...prev, nuevo]);
      setVista({ modo: 'lista' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear el usuario.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEditar(
    id_usuario: number,
    values: { rut: string; nombre: string; apellidos: string; email: string; id_rol: number; id_compania: number },
  ) {
    setIsSaving(true);
    setFormError(null);
    try {
      const actualizado = await editarUsuario(id_usuario, values);
      setUsuarios((prev) => prev.map((u) => (u.id_usuario === id_usuario ? actualizado : u)));
      setVista({ modo: 'lista' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo editar el usuario.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCambiarEstado(usuario: Usuario) {
    const actualizado = await cambiarEstadoUsuario(usuario.id_usuario, !usuario.estado_activo);
    setUsuarios((prev) => prev.map((u) => (u.id_usuario === usuario.id_usuario ? actualizado : u)));
  }

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      // Para Comandancia: solo deben verse roles operativos a cargo (bomberos y mecánicos),
      // excluyendo administradores y operadores de central de despacho.
      if (!esAdmin) {
        const nombreRol = roles.find((r) => r.id_rol === u.id_rol)?.nombre_rol;
        if (nombreRol === 'administrador' || nombreRol === 'central') {
          return false;
        }
      }

      // Filtro por estado
      if (estado === 'activos' && !u.estado_activo) return false;
      if (estado === 'inactivos' && u.estado_activo) return false;

      // Filtro por compañía seleccionada
      if (idCompania !== 'todas' && String(u.id_compania) !== idCompania) return false;

      // Filtro texto (RUT solo si es admin, nombre, apellidos o compañía)
      if (q.trim()) {
        const query = q.toLowerCase().trim();
        const rut = esAdmin ? (u.rut || '').toLowerCase() : '';
        const nombreCompleto = `${u.nombre || ''} ${u.apellidos || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const ciaNombre = companias.find((c) => c.id_compania === u.id_compania)?.nombre.toLowerCase() || '';

        const match =
          (esAdmin && rut.includes(query)) ||
          nombreCompleto.includes(query) ||
          email.includes(query) ||
          ciaNombre.includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [usuarios, roles, q, estado, idCompania, companias, esAdmin]);

  if (isLoading) {
    return <p>Cargando usuarios…</p>;
  }

  if (loadError) {
    return <p className="usuarios-form__alert" role="alert">{loadError}</p>;
  }

  return (
    <div className="usuarios-page">
      <div className="usuarios-page__header">
        <div>
          <h1 className="usuarios-page__title">
            {esAdmin ? 'Usuarios del Sistema' : 'Personal y Dotación a Cargo'}
          </h1>
          <p style={{ margin: 'var(--space-1) 0 0', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-ink-500)' }}>
            {esAdmin
              ? 'Gestión y administración de cuentas de usuario, roles y credenciales.'
              : 'Nómina del personal institucional, cargos y estado de disponibilidad.'}
          </p>
        </div>
        {esAdmin && vista.modo === 'lista' && (
          <button
            className="usuarios-page__nuevo"
            onClick={() => {
              setFormError(null);
              setVista({ modo: 'crear' });
            }}
          >
            + Nuevo usuario
          </button>
        )}
      </div>

      {vista.modo === 'lista' && (
        <>
          <div className="usuarios-page__filtros">
            <input
              type="text"
              className="usuarios-page__filtro-input"
              placeholder={esAdmin ? 'Buscar por RUT, nombre o compañía...' : 'Buscar por nombre o compañía...'}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="usuarios-page__filtro-select"
              value={estado}
              onChange={(e) => setEstado(e.target.value as 'todos' | 'activos' | 'inactivos')}
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Deshabilitados</option>
            </select>
            <select
              className="usuarios-page__filtro-select"
              value={idCompania}
              onChange={(e) => setIdCompania(e.target.value)}
            >
              <option value="todas">Todas las compañías</option>
              {companias.map((c) => (
                <option key={c.id_compania} value={String(c.id_compania)} title={c.nombre}>
                  {formatoNombreCompania(c.nombre)}
                </option>
              ))}
            </select>
          </div>

          <UsuariosTable
            usuarios={usuariosFiltrados}
            roles={roles}
            companias={companias}
            esAdmin={esAdmin}
            onEditar={
              esAdmin
                ? (usuario) => {
                    setFormError(null);
                    setVista({ modo: 'editar', usuario });
                  }
                : undefined
            }
            onCambiarEstado={esAdmin ? handleCambiarEstado : undefined}
          />
        </>
      )}

      {vista.modo === 'crear' && (
        <UsuarioForm
          roles={roles}
          companias={companias}
          isSaving={isSaving}
          serverError={formError}
          onSubmit={handleCrear}
          onCancel={() => setVista({ modo: 'lista' })}
        />
      )}

      {vista.modo === 'editar' && (
        <UsuarioForm
          usuarioExistente={vista.usuario}
          roles={roles}
          companias={companias}
          isSaving={isSaving}
          serverError={formError}
          onSubmit={(values) => handleEditar(vista.usuario.id_usuario, values)}
          onCancel={() => setVista({ modo: 'lista' })}
        />
      )}
    </div>
  );
}
