import { Vehicle, MaintenanceLog, FleetMovementLog, Incident, UserRole } from './types';

// Initial categories/types of vehicles
export const INITIAL_VEHICLE_TYPES = [
  'Grua Pesada',
  'Grua Liviana',
  'Ambulancia',
  'Patrulla',
  'Vehiculo de Apoyo a la Operacion',
  'Vehiculo Administrativo',
  'Carros de arrastre',
  'remolques y semirremolques',
  'Maquinaria pesada',
  'Carros de Bomberos',
  'Vehiculode Rescate',
  'Vehiculo Hazmat'
];

// Initial vehicles in the Santiago area for precise simulation on a real-time responsive dashboard
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    codigo_unico: 'FL-101',
    ppu: 'RJGY88',
    marca: 'Ford',
    modelo: 'F-550 Ranger Super Duty',
    anio: 2023,
    tipo: 'Grua Pesada',
    gps_proveedor: 'BlackGPS',
    tarjeta_combustible: 'Copec',
    numero_tag: 'TAG-998822',
    kilometraje: 42150,
    contrato: 'AVO',
    centro_costo: 800,
    proveedor: 'SALFA',
    estado: 'Operativo',
    velocidad: 68,
    coords: { lat: -33.3980, lng: -70.5890 }, // Américo Vespucio Oriente, Huechuraba/Vitacura
    chofer: 'Carlos Espinoza',
    documentos: {
      permiso_circulacion: { fecha_vencimiento: '2027-03-31', cargado: true, nombre_archivo: 'permiso_circ_RJGY88.pdf' },
      soap: { fecha_vencimiento: '2027-03-31', cargado: true, nombre_archivo: 'soap_RJGY88.pdf' },
      revision_tecnica: { fecha_vencimiento: '2026-10-15', cargado: true, nombre_archivo: 'rt_RJGY88_pass.pdf' },
      emision_gases: { fecha_vencimiento: '2026-10-15', cargado: true, nombre_archivo: 'emision_gases_RJGY88.pdf' }
    }
  },
  {
    codigo_unico: 'FL-205',
    ppu: 'PPDX45',
    marca: 'Hyundai',
    modelo: 'H-1 Solati',
    anio: 2021,
    tipo: 'Ambulancia',
    gps_proveedor: 'Maxtracker',
    tarjeta_combustible: 'Shell',
    numero_tag: 'TAG-112233',
    kilometraje: 98120,
    contrato: 'EMERGENCIAS',
    centro_costo: 100,
    proveedor: 'GAMMA',
    estado: 'Operativo',
    velocidad: 85,
    coords: { lat: -33.4560, lng: -70.6480 }, // Central Santiago area
    chofer: 'Ana María Toledo',
    documentos: {
      permiso_circulacion: { fecha_vencimiento: '2026-03-31', cargado: false },
      soap: { fecha_vencimiento: '2027-03-31', cargado: true, nombre_archivo: 'soap_ambulance_ppdx.pdf' },
      revision_tecnica: { fecha_vencimiento: '2026-07-20', cargado: true, nombre_archivo: 'rev_tec_2026.pdf' },
      emision_gases: { fecha_vencimiento: '2026-07-20', cargado: true, nombre_archivo: 'gases_2026_ok.pdf' }
    }
  },
  {
    codigo_unico: 'FL-312',
    ppu: 'TXSW22',
    marca: 'Chevrolet',
    modelo: 'D-Max 4x4',
    anio: 2022,
    tipo: 'Patrulla',
    gps_proveedor: 'Webfleet',
    tarjeta_combustible: 'Copec',
    numero_tag: 'TAG-554433',
    kilometraje: 71200,
    contrato: 'AUTOPISTA CENTRAL',
    centro_costo: 1800,
    proveedor: 'ECONORENT',
    estado: 'Operativo',
    velocidad: 92,
    coords: { lat: -33.5210, lng: -70.6890 }, // Autopista Central Sur, San Bernardo
    chofer: 'Juan Ignacio Pérez',
    documentos: {
      permiso_circulacion: { fecha_vencimiento: '2027-03-31', cargado: true, nombre_archivo: 'permiso_TXSW22.pdf' },
      soap: { fecha_vencimiento: '2027-03-31', cargado: true, nombre_archivo: 'soap_TXSW22.pdf' },
      revision_tecnica: { fecha_vencimiento: '2026-05-30', cargado: false }, // Vencido! Alert indicator
      emision_gases: { fecha_vencimiento: '2026-05-30', cargado: false } // Vencido!
    }
  },
  {
    codigo_unico: 'FL-404',
    ppu: 'LKWV79',
    marca: 'Scania',
    modelo: 'G410 Heavy Duty',
    anio: 2020,
    tipo: 'Grua Pesada',
    gps_proveedor: 'Webfleet',
    tarjeta_combustible: 'Shell',
    numero_tag: 'TAG-001155',
    kilometraje: 154000,
    contrato: 'PESADOS',
    centro_costo: 200,
    proveedor: 'NERA',
    estado: 'Mantenimiento',
    velocidad: 0,
    coords: { lat: -33.4320, lng: -70.7420 }, // Pudahuel Workstations/Taller
    chofer: 'Ricardo Contreras',
    documentos: {
      permiso_circulacion: { fecha_vencimiento: '2027-03-31', cargado: true, nombre_archivo: 'perm_circ_heavy_truck.pdf' },
      soap: { fecha_vencimiento: '2027-03-31', cargado: true, nombre_archivo: 'soap_heavy_truck.pdf' },
      revision_tecnica: { fecha_vencimiento: '2026-11-20', cargado: true, nombre_archivo: 'revision_tech_scania.pdf' },
      emision_gases: { fecha_vencimiento: '2026-11-20', cargado: true, nombre_archivo: 'em_gases_scania.pdf' }
    }
  },
  {
    codigo_unico: 'FL-509',
    ppu: 'KKPP90',
    marca: 'Toyota',
    modelo: 'Hilux SRX',
    anio: 2024,
    tipo: 'Vehiculo de Apoyo a la Operacion',
    gps_proveedor: 'BlackGPS',
    tarjeta_combustible: 'Copec',
    numero_tag: 'TAG-887711',
    kilometraje: 18450,
    contrato: 'ISA MAIPO',
    centro_costo: 300,
    proveedor: 'SALFA',
    estado: 'Operativo',
    velocidad: 74,
    coords: { lat: -33.6550, lng: -70.7100 }, // Autopista del Maipo near Buin
    chofer: 'Mauricio Aránguiz',
    documentos: {
      permiso_circulacion: { fecha_vencimiento: '2027-03-31', cargado: true, nombre_archivo: 'permiso_2027_toy_hilux.pdf' },
      soap: { fecha_vencimiento: '2027-03-31', cargado: true, nombre_archivo: 'soap_hilux.pdf' },
      revision_tecnica: { fecha_vencimiento: '2027-01-10', cargado: true, nombre_archivo: 'rt_hilux_2027.pdf' },
      emision_gases: { fecha_vencimiento: '2027-01-10', cargado: true, nombre_archivo: 'em_gases_hilux.pdf' }
    }
  },
  {
    codigo_unico: 'FL-611',
    ppu: 'CCWW44',
    marca: 'Mercedes-Benz',
    modelo: 'Sprinter 516 Cargo',
    anio: 2022,
    tipo: 'Vehiculode Rescate',
    gps_proveedor: 'Maxtracker',
    tarjeta_combustible: 'Copec',
    numero_tag: 'TAG-552277',
    kilometraje: 52100,
    contrato: 'RUTA DE LA FRUTA',
    centro_costo: 1200,
    proveedor: 'GAMMA',
    estado: 'Siniestrado', // Under active insurance review
    velocidad: 0,
    coords: { lat: -34.1200, lng: -71.1800 }, // Route to Melipilla
    chofer: 'Andrés Valenzuela',
    documentos: {
      permiso_circulacion: { fecha_vencimiento: '2026-03-31', cargado: true, nombre_archivo: 'permiso_sprinter_vigente.pdf' },
      soap: { fecha_vencimiento: '2026-03-31', cargado: true, nombre_archivo: 'soap_sprinter_vigente.pdf' },
      revision_tecnica: { fecha_vencimiento: '2026-08-15', cargado: true, nombre_archivo: 'rt_sprinter_ccww.pdf' },
      emision_gases: { fecha_vencimiento: '2026-08-15', cargado: true, nombre_archivo: 'gases_ccww.pdf' }
    }
  },
  {
    codigo_unico: 'FL-008',
    ppu: 'HJKD88',
    marca: 'Peugeot',
    modelo: 'Partner Maxi',
    anio: 2021,
    tipo: 'Vehiculo Administrativo',
    gps_proveedor: 'Sin GPS',
    tarjeta_combustible: 'Sin Tarjeta',
    numero_tag: 'TAG-332211',
    kilometraje: 89300,
    contrato: 'ADMINISTRACION',
    centro_costo: 600,
    proveedor: 'ECONORENT',
    estado: 'Operativo',
    velocidad: 45,
    coords: { lat: -33.4150, lng: -70.6050 }, // Providencia area
    chofer: 'Sofía Prado',
    documentos: {
      permiso_circulacion: { fecha_vencimiento: '2026-03-31', cargado: true, nombre_archivo: 'permiso_partner_HJKD88.pdf' },
      soap: { fecha_vencimiento: '2026-03-31', cargado: true, nombre_archivo: 'soap_partner_HJKD88.pdf' },
      revision_tecnica: { fecha_vencimiento: '2026-04-12', cargado: true, nombre_archivo: 'revision_parter_hjkd.pdf' }, // Expired
      emision_gases: { fecha_vencimiento: '2026-04-12', cargado: true, nombre_archivo: 'gases_partner_hjkd.pdf' }  // Expired
    }
  }
];

// Initial maintenance logs
export const INITIAL_MAINTENANCE_LOGS: MaintenanceLog[] = [
  {
    id: 'MNT-2001',
    codigo_vehiculo: 'FL-101',
    ppu: 'RJGY88',
    fecha: '2026-05-12',
    tipo_servicio: 'Mantención Correctiva Horas/Kilometraje',
    kilometraje: 40000,
    costo: 485000,
    descripcion: 'Reemplazo de pastillas de frenos delanteras, afinamiento de motor, cambio filtros de aceite, aire y combustible.',
    taller: 'Servicio Técnico Autorizado Ford - SALFA Alameda'
  },
  {
    id: 'MNT-2002',
    codigo_vehiculo: 'FL-404',
    ppu: 'LKWV79',
    fecha: '2026-06-18',
    tipo_servicio: 'Reparación de Sistema Hidráulico',
    kilometraje: 154000,
    costo: 1250000,
    descripcion: 'Cambio de mangueras de alta presión y sellos del pistón principal de izaje de la grúa pesada. Cambio de fluido hidráulico grado ISO 46.',
    taller: 'Maquinarias Pesadas Chile - Pudahuel'
  },
  {
    id: 'MNT-2003',
    codigo_vehiculo: 'FL-509',
    ppu: 'KKPP90',
    fecha: '2026-04-20',
    tipo_servicio: 'Mantención Preventiva 15.000 KM',
    kilometraje: 15000,
    costo: 240000,
    descripcion: 'Inspección de 30 puntos de seguridad, alineación, balanceo, rotación de neumáticos, cambio de aceite sintético 5W30.',
    taller: 'Piamonte Toyota Santiago'
  }
];

// Initial movement logs
export const INITIAL_MOVEMENT_LOGS: FleetMovementLog[] = [
  {
    id: 'MOV-3001',
    codigo_vehiculo: 'FL-101',
    ppu: 'RJGY88',
    fecha: '2026-01-10',
    tipo_movimiento: 'Entrada',
    contrato_origen: 'ADMINISTRACION',
    contrato_destino: 'AVO',
    comentario: 'Asignación de nueva grúa pesada recién arrendada de SALFA para cobertura vial del túnel Américo Vespucio Oriente.',
    operador: 'Eduardo Garrido (Jefe de Logística)'
  },
  {
    id: 'MOV-3002',
    codigo_vehiculo: 'FL-509',
    ppu: 'KKPP90',
    fecha: '2026-03-15',
    tipo_movimiento: 'Cambio de Contrato',
    contrato_origen: 'AUTOCONTROL',
    contrato_destino: 'ISA MAIPO',
    comentario: 'Traslado del vehículo de apoyo operacional a Autopista Maipo para habilitar labores de inspección invernal.',
    operador: 'Patricia Muñoz (Supervisora)'
  },
  {
    id: 'MOV-3003',
    codigo_vehiculo: 'FL-312',
    ppu: 'TXSW22',
    fecha: '2026-05-01',
    tipo_movimiento: 'Entrada',
    contrato_origen: 'TALLER',
    contrato_destino: 'AUTOPISTA CENTRAL',
    comentario: 'Retorno a la operación regular luego de reparación de alternador y sistema eléctrico en Taller Central.',
    operador: 'Carlos Espinoza (Supervisor Central)'
  }
];

// Initial incident logs
export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-4001',
    codigo_vehiculo: 'FL-611',
    ppu: 'CCWW44',
    fecha: '2026-06-05',
    tipo_incidente: 'Siniestro Vial',
    descripcion: 'Patinazo en calzada húmeda con posterior colisión menor contra barrera de contención en Ruta de la Fruta, kilómetro 48. Daños en tapabarros izquierdo y óptico frontal.',
    gravedad: 'Moderada',
    costo_estimado: 750000,
    estado_resolucion: 'En Proceso',
    comentario_seguro: 'Denuncio ingresado a BCI Seguros, orden de reparación pendiente en taller Gamma.'
  },
  {
    id: 'INC-4002',
    codigo_vehiculo: 'FL-205',
    ppu: 'PPDX45',
    fecha: '2026-05-20',
    tipo_incidente: 'Falla Mecánica',
    descripcion: 'Pérdida de potencia en autopista. Se detecta ruptura de manguera de retorno de combustible. Vehículo rescatado por asistencia en ruta.',
    gravedad: 'Leve',
    costo_estimado: 95000,
    estado_resolucion: 'Resuelto',
    comentario_seguro: 'No aplica seguro, costo cubierto por caja chica logística.'
  }
];

// Initial users with custom permissions configured dynamically
export const INITIAL_USERS: UserRole[] = [
  {
    id: 'USR-01',
    nombre: 'Geólogo Administrador',
    email: 'Geologol@gmail.com',
    rol: 'Administrador',
    activo: true,
    permisos: {
      ver_dashboard: true,
      ver_mapas: true,
      ver_flota: true,
      editar_flota: true,
      ver_documentos: true,
      cargar_documentos: true,
      descargar_documentos: true,
      movimientos_flota: true,
      incidentes_siniestros: true,
      mantenimientos: true,
      gestionar_usuarios: true,
      descargar_auditoria: true,
      carga_masiva: true,
      gestion_supervisores: true
    }
  },
  {
    id: 'USR-02',
    nombre: 'Javier Castillo (Gestor Operaciones)',
    email: 'jcastillo@flota.cl',
    rol: 'Gestor',
    activo: true,
    permisos: {
      ver_dashboard: true,
      ver_mapas: true,
      ver_flota: true,
      editar_flota: true,
      ver_documentos: true,
      cargar_documentos: true,
      descargar_documentos: true,
      movimientos_flota: true,
      incidentes_siniestros: true,
      mantenimientos: true,
      gestionar_usuarios: false, // Access limited!
      descargar_auditoria: true,
      carga_masiva: false,
      gestion_supervisores: true
    }
  },
  {
    id: 'USR-03',
    nombre: 'Patricio Ruiz (Operador de Turno)',
    email: 'pruiz@flota.cl',
    rol: 'Operador',
    activo: true,
    permisos: {
      ver_dashboard: true,
      ver_mapas: true,
      ver_flota: true,
      editar_flota: false, // Cannot edit fleet
      ver_documentos: true,
      cargar_documentos: false, // Cannot upload sensitive documents
      descargar_documentos: false, // Cannot download sensitive documents
      movimientos_flota: true, // Can log movements
      incidentes_siniestros: true, // Can log incidents
      mantenimientos: false,
      gestionar_usuarios: false,
      descargar_auditoria: false,
      carga_masiva: false,
      gestion_supervisores: false
    }
  },
  {
    id: 'USR-04',
    nombre: 'Eduardo Garrido (Supervisor AVO)',
    email: 'egarrido@flota.cl',
    rol: 'Supervisor',
    activo: true,
    contratos_supervisor: ['AVO'],
    permisos: {
      ver_dashboard: true,
      ver_mapas: false,
      ver_flota: false,
      editar_flota: false,
      ver_documentos: false,
      cargar_documentos: false,
      descargar_documentos: false,
      movimientos_flota: false,
      incidentes_siniestros: false,
      mantenimientos: false,
      gestionar_usuarios: false,
      descargar_auditoria: false,
      carga_masiva: false,
      gestion_supervisores: true
    }
  },
  {
    id: 'USR-05',
    nombre: 'Carolina Méndez (Supervisor ISA MAIPO)',
    email: 'cmendez@flota.cl',
    rol: 'Supervisor',
    activo: true,
    contratos_supervisor: ['ISA MAIPO'],
    permisos: {
      ver_dashboard: true,
      ver_mapas: false,
      ver_flota: false,
      editar_flota: false,
      ver_documentos: false,
      cargar_documentos: false,
      descargar_documentos: false,
      movimientos_flota: false,
      incidentes_siniestros: false,
      mantenimientos: false,
      gestionar_usuarios: false,
      descargar_auditoria: false,
      carga_masiva: false,
      gestion_supervisores: true
    }
  }
];
