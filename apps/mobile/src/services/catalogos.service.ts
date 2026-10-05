import { api } from './api';
import { Rol, Compania } from '../types/auth';

export async function listarRoles(): Promise<Rol[]> {
  const { data } = await api.get<Rol[]>('/roles');
  return data;
}

export async function listarCompanias(): Promise<Compania[]> {
  const { data } = await api.get<Compania[]>('/companias');
  return data;
}