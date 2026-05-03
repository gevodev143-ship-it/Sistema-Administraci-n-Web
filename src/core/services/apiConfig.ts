// Definimos el tipo de los endpoints para mayor seguridad
interface Endpoints {
  crearProducto: string;
  actualizarProducto: string;
  exportarCSV: string;
  marcas: string;
  categorias: string;
  storage: string;
  exportCSV: string;
  backup: string;
  importarDirectorio: string;
}


// URL base (puedes cambiarla según entorno: dev, prod, etc.)
export const API_BASE_URL = "http://localhost:3001/api";

// Objeto con los endpoints tipados
export const ENDPOINTS: Endpoints = {
  crearProducto: `${API_BASE_URL}/crearProducto`,
  actualizarProducto: `${API_BASE_URL}/actualizarProducto`,
  exportarCSV: `${API_BASE_URL}/exportarCSVCompleto`,
  marcas: `${API_BASE_URL}/marcas`,
  categorias: `${API_BASE_URL}/categorias`,
  storage: `${API_BASE_URL}/storage`,
  exportCSV: `${API_BASE_URL}/export/csv`,
  backup: `${API_BASE_URL}/export/backup`,
  importarDirectorio: `${API_BASE_URL}/import/bd`,
};
