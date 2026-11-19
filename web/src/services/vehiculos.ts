import { apiClient } from './apiClient';
import { listarCompanias, type CompaniaOption } from './usuarios';

export type { CompaniaOption };
export { listarCompanias };

export type EstadoVehiculo = 'operativo' | 'en_mantencion' | 'fuera_de_servicio';

export interface TipoVehiculo {
  id_tipo_vehiculo: number;
  nombre_tipo: string;
  descripcion?: string | null;
}

export interface Vehiculo {
  id_vehiculo: number;
  patente: string;
  nomenclatura?: string | null;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number | string;
  estado_operativo: EstadoVehiculo;
  id_tipo_vehiculo?: number | null;
  tipoVehiculo?: TipoVehiculo | null;
  id_compania: number;
  compania?: { id_compania: number; nombre: string; numero_compania?: number };
  coordenadas?: any;
  proxima_mantencion?: number;
  /** Foto del vehículo. Pendiente en backend/BD; mientras tanto la tarjeta usa una ilustración. */
  imagen_url?: string | null;
}

export interface PaginatedVehiculos {
  data: Vehiculo[];
  total: number;
  page: number;
}

/**
 * Trae TODOS los vehículos que calcen con el filtro, recorriendo todas las
 * páginas que haga falta (F4: antes solo se traía la página 1 con límite 50
 * y el resto de la flota desaparecía de mapa/formularios/historial).
 */
export const listarVehiculos = async (params?: { estado?: string; q?: string; id_compania?: number }) => {
  const LIMITE_POR_PAGINA = 100; // tope que ya aplica el backend (Math.min(100, ...))

  function construirQuery(page: number): string {
    const search = new URLSearchParams();
    if (params?.estado) search.set('estado', params.estado);
    if (params?.q) search.set('q', params.q);
    if (params?.id_compania) search.set('id_compania', String(params.id_compania));
    search.set('page', String(page));
    search.set('limit', String(LIMITE_POR_PAGINA));
    return `/vehiculos?${search.toString()}`;
  }

  const primera = await apiClient.get<PaginatedVehiculos>(construirQuery(1));
  const todos = [...primera.data];

  const totalPaginas = Math.ceil(primera.total / LIMITE_POR_PAGINA);
  for (let page = 2; page <= totalPaginas; page++) {
    const siguiente = await apiClient.get<PaginatedVehiculos>(construirQuery(page));
    todos.push(...siguiente.data);
  }

  return todos;
};

export const crearVehiculo = (body: unknown) => apiClient.post<Vehiculo>('/vehiculos', body);
export const editarVehiculo = (id: number, body: unknown) => apiClient.patch<Vehiculo>(`/vehiculos/${id}`, body);

export const listarTiposVehiculo = () => apiClient.get<TipoVehiculo[]>('/tipos-vehiculo');
export const listarVistaVehiculos = () => apiClient.get<any[]>('/vehiculos/vista');

