import { apiClient } from './apiClient';
import { listarCompanias, type CompaniaOption } from './usuarios';

export type { CompaniaOption };
export { listarCompanias };

export type EstadoVehiculo = 'operativo' | 'en_mantencion' | 'fuera_de_servicio';

export interface Vehiculo {
  id_vehiculo: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number | string;
  estado_operativo: EstadoVehiculo;
  id_compania: number;
  coordenadas?: any;
  proxima_mantencion?: number;
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
export const listarVehiculos = async (params?: { estado?: string; q?: string }) => {
  const LIMITE_POR_PAGINA = 100; // tope que ya aplica el backend (Math.min(100, ...))

  function construirQuery(page: number): string {
    const search = new URLSearchParams();
    if (params?.estado) search.set('estado', params.estado);
    if (params?.q) search.set('q', params.q);
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

