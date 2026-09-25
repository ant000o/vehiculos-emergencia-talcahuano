import { useEffect, useState } from 'react';
import {
  listarUsuarios,
  listarRoles,
  listarCompanias,
  crearUsuario,
  editarUsuario,
  cambiarEstadoUsuario,
  type Usuario,
  type RolOption,
  type CompaniaOption,
} from '../../services/usuarios';
import { UsuariosTable } from './UsuariosTable';
import { UsuarioForm } from './UsuarioForm';
import './usuarios.css';

type Vista = { modo: 'lista' } | { modo: 'crear' } | { modo: 'editar'; usuario: Usuario };

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [vista, setVista] = useState<Vista>({ modo: 'lista' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Carga inicial: usuarios + catálogos de roles y compañías para los <select>.
  useEffect(() => {
    async function cargarDatos() {
      const [listaUsuarios, listaRoles, listaCompanias] = await Promise.all([
        listarUsuarios(),
        listarRoles(),
        listarCompanias(),
      ]);
      setUsuarios(listaUsuarios);
      setRoles(listaRoles);
      setCompanias(listaCompanias);
      setIsLoading(false);
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

  if (isLoading) {
    return <p>Cargando usuarios…</p>;
  }

  return (
    <div className="usuarios-page">
      <div className="usuarios-page__header">
        <h1 className="usuarios-page__title">Usuarios</h1>
        {vista.modo === 'lista' && (
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
        <UsuariosTable
          usuarios={usuarios}
          roles={roles}
          companias={companias}
          onEditar={(usuario) => {
            setFormError(null);
            setVista({ modo: 'editar', usuario });
          }}
          onCambiarEstado={handleCambiarEstado}
        />
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
