/**
 * Types and interfaces for the Sistema de Control de Flota
 */

export interface DocumentState {
  fecha_vencimiento: string;
  cargado: boolean;
  nombre_archivo?: string;
  contenidoSimulado?: string; // Base64 or mock binary info for downloads
}

export interface DocumentosVehiculo {
  permiso_circulacion: DocumentState;
  soap: DocumentState;
  revision_tecnica: DocumentState;
  emision_gases: DocumentState;
}

export type TipoVehiculo =
  | 'Grua Pesada'
  | 'Grua Liviana'
  | 'Ambulancia'
  | 'Patrulla'
  | 'Vehiculo de Apoyo a la Operacion'
  | 'Vehiculo Administrativo'
  | 'Carros de arrastre'
  | 'remolques y semirremolques'
  | 'Maquinaria pesada'
  | 'Carros de Bomberos'
  | 'Vehiculode Rescate'
  | 'Vehiculo Hazmat';

export type ProveedorGPS = 'BlackGPS' | 'Maxtracker' | 'Webfleet' | 'Sin GPS';
export type ProveedorCombustible = 'Copec' | 'Shell' | 'Sin Tarjeta';
export type ProveedorLeasing = 'SALFA' | 'GAMMA' | 'ECONORENT' | 'NERA';

export interface Vehicle {
  codigo_unico: string;
  ppu: string; // Patent plate, letters and numbers only, no spaces or hyphens (e.g., ABCD12)
  marca: string;
  modelo: string;
  anio: number;
  tipo: TipoVehiculo | string; // Allows custom categories created by admin
  gps_proveedor: ProveedorGPS | string;
  tarjeta_combustible: ProveedorCombustible | string;
  numero_tag: string;
  kilometraje: number;
  contrato: string; // AVO, ISA MAIPO, etc.
  centro_costo: number; // Linked value
  proveedor: ProveedorLeasing | string;
  estado: 'Operativo' | 'Mantenimiento' | 'Siniestrado' | 'Inactivo';
  documentos: DocumentosVehiculo;
  coords: {
    lat: number;
    lng: number;
  };
  velocidad: number; // Current simulated speed in km/h
  chofer?: string;
}

export interface MaintenanceLog {
  id: string;
  codigo_vehiculo: string;
  ppu: string;
  fecha: string;
  tipo_servicio: string;
  kilometraje: number;
  costo: number;
  descripcion: string;
  taller: string;
  contrato?: string;
  centro_costo?: number;
  responsable?: string;
}

export interface FleetMovementLog {
  id: string;
  codigo_vehiculo: string;
  ppu: string;
  fecha: string;
  tipo_movimiento: 'Entrada' | 'Salida' | 'Cambio de Contrato';
  contrato_origen?: string;
  contrato_destino: string;
  comentario: string;
  operador: string;
}

export interface Incident {
  id: string;
  codigo_vehiculo: string;
  ppu: string;
  fecha: string;
  tipo_incidente: 'Colisión' | 'Choque' | 'Falla Mecánica' | 'Robo/Hurto' | 'Siniestro Vial' | 'Otro';
  descripcion: string;
  gravedad: 'Leve' | 'Moderada' | 'Grave';
  costo_estimado: number;
  estado_resolucion: 'Pendiente' | 'En Proceso' | 'Resuelto';
  comentario_seguro?: string;
}

export interface UserPermissions {
  ver_dashboard: boolean;
  ver_mapas: boolean;
  ver_flota: boolean;
  editar_flota: boolean;
  ver_documentos: boolean;
  cargar_documentos: boolean;
  descargar_documentos: boolean;
  movimientos_flota: boolean;
  incidentes_siniestros: boolean;
  mantenimientos: boolean;
  gestionar_usuarios: boolean;
  descargar_auditoria: boolean;
  carga_masiva: boolean;
  gestion_supervisores?: boolean;
}

export interface UserRole {
  id: string;
  nombre: string;
  email: string;
  rol: 'Administrador' | 'Gestor' | 'Operador' | 'Supervisor';
  activo: boolean;
  permisos: UserPermissions;
  contratos_supervisor?: string[];
}

// Contract connection to cost centers
export const CONTRATO_CENTRO_COSTO: Record<string, number> = {
  'AVO': 800,
  'ISA MAIPO': 300,
  'RUTA DE LA FRUTA': 1200,
  'NAHUELBUTA': 1400,
  'CONG': 1500,
  'PUENTE INDUSTRIAL': 1700,
  'FEPASA': 1100,
  'PESADOS': 200,
  'ASOCIADOS': 201,
  'TALLER': 500,
  'EMERGENCIAS': 100,
  'ADMINISTRACION': 600,
  'AUTOPISTA CENTRAL': 1800,
  'AVN-TSC': 1300
};

export interface SupervisorFuelLoad {
  fecha: string;
  hora: string;
  proveedor: 'Copec' | 'Shell';
  litros: number;
  valor_combustible: number;
  monto_total: number;
  observaciones: string;
}

export interface SupervisorFleetLog {
  id: string;
  ppu: string;
  fecha_actualizacion: string; // ISO String or YYYY-MM-DD HH:mm:ss
  odometro: number;
  combustible?: SupervisorFuelLoad;
  observaciones?: string;
  periodoId: string; // Friday date as period ID, e.g., "2026-06-26"
  supervisor_nombre: string;
  contrato: string;
}

export interface WorkshopChecklist {
  luces: boolean;
  neumaticos: boolean;
  carroceria: boolean;
  herramientas: boolean;
  documentos: boolean;
  limpieza?: boolean;
  fluidos?: boolean;
  prueba_ruta?: boolean;
}

export interface WorkshopLog {
  id: string;
  tipo: 'Ingreso' | 'Salida';
  ppu: string;
  codigo_vehiculo: string;
  fecha: string;
  odometro: number;
  responsable: string;
  checklist: WorkshopChecklist;
  observaciones: string;
}

