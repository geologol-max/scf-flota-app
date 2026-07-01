import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Vehicle,
  MaintenanceLog,
  FleetMovementLog,
  Incident,
  UserRole,
  UserPermissions,
  CONTRATO_CENTRO_COSTO,
  SupervisorFleetLog,
  WorkshopLog
} from './types';
import {
  subscribeToVehicles,
  subscribeToMaintenance,
  subscribeToMovements,
  subscribeToIncidents,
  subscribeToUsers,
  subscribeToSupervisorLogs,
  subscribeToWorkshopLogs,
  updateVehicle,
  updateMaintenanceLog,
  updateMovementLog,
  updateIncident,
  updateUser,
  updateSupervisorLog,
  addVehicle,
  addMaintenanceLog,
  addMovementLog,
  addIncident,
  addUser,
  addSupervisorLog,
  addWorkshopLog
} from './lib/firestore';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import VehicleInventory from './components/VehicleInventory';
import MaintenanceTab from './components/MaintenanceTab';
import MovementsTab from './components/MovementsTab';
import IncidentsTab from './components/IncidentsTab';
import PermissionsManager from './components/PermissionsManager';
import PredictiveAnalytics from './components/PredictiveAnalytics';
import SupervisorsTab from './components/SupervisorsTab';
import WorkshopTab from './components/WorkshopTab';
import { exportToExcel, triggerPDFPrint } from './utils/exporters';

import {
  Truck,
  MapPin,
  Wrench,
  ArrowRightLeft,
  AlertTriangle,
  Users,
  BrainCircuit,
  Radio,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  LayoutDashboard,
  Shield,
  Clock,
  LogOut,
  Settings,
  Menu,
  ChevronRight,
  Sparkles,
  Fuel,
  Lock,
  CheckCircle,
  ClipboardCheck
} from 'lucide-react';

export default function App() {
  // ── Autenticación Firebase ────────────────────────────────────────────────
  const { user, loading: authLoading, error: authError, signIn, signOut } = useAuth();

  // ── Estado global — alimentado por Firestore en tiempo real ───────────────
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [movementLogs, setMovementLogs] = useState<FleetMovementLog[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [supervisorLogs, setSupervisorLogs] = useState<SupervisorFleetLog[]>([]);
  const [workshopLogs, setWorkshopLogs] = useState<WorkshopLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('fleet_categories');
    return saved ? JSON.parse(saved) : [];
  });

  // Current active logged user (first admin found, or first user)
  const [currentSimulatedUser, setCurrentSimulatedUser] = useState<UserRole | null>(null);

  // ── Suscripciones Firestore (solo cuando el usuario está autenticado) ─────
  useEffect(() => {
    if (!user) return;

    let resolved = 0;
    const total = 7;
    const checkDone = () => { resolved++; if (resolved >= total) setDataLoading(false); };

    const unsubVehicles = subscribeToVehicles((data) => { setVehicles(data); checkDone(); });
    const unsubMaint = subscribeToMaintenance((data) => { setMaintenanceLogs(data); checkDone(); });
    const unsubMov = subscribeToMovements((data) => { setMovementLogs(data); checkDone(); });
    const unsubInc = subscribeToIncidents((data) => { setIncidents(data); checkDone(); });
    const unsubUsers = subscribeToUsers((data) => {
      setUsers(data);
      setCurrentSimulatedUser(prev => {
        if (prev) return prev;
        if (data.length > 0) {
          return data.find(u => u.rol === 'Administrador') ?? data[0];
        }
        // BD vacía: construir admin temporal desde Firebase Auth
        return {
          id: user.uid,
          nombre: user.displayName ?? user.email?.split('@')[0] ?? 'Administrador',
          email: user.email ?? '',
          rol: 'Administrador',
          activo: true,
          permisos: {
            ver_dashboard: true, ver_mapas: true, ver_flota: true,
            editar_flota: true, ver_documentos: true, cargar_documentos: true,
            descargar_documentos: true, movimientos_flota: true,
            incidentes_siniestros: true, mantenimientos: true,
            gestionar_usuarios: true, descargar_auditoria: true,
            carga_masiva: true, gestion_supervisores: true,
          },
        };
      });
      checkDone();
    });
    const unsubSup = subscribeToSupervisorLogs((data) => { setSupervisorLogs(data); checkDone(); });
    const unsubWorkshop = subscribeToWorkshopLogs((data) => { setWorkshopLogs(data); checkDone(); });

    return () => {
      unsubVehicles();
      unsubMaint();
      unsubMov();
      unsubInc();
      unsubUsers();
      unsubSup();
      unsubWorkshop();
    };
  }, [user]);

  // Persist custom categories locally (no necesita Firestore)
  useEffect(() => {
    localStorage.setItem('fleet_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedVehicleOnMap, setSelectedVehicleOnMap] = useState<Vehicle | null>(null);
  


  // Synchronize current role simulator when edited in user panel settings list
  const handleSelectSimulatedUser = (u: UserRole) => {
    setCurrentSimulatedUser(u);
  };

  // ─── Sincronización robusta con Firestore ────────────────────────────────────
  const handleUpdateVehicles = async (updated: Vehicle[]) => {
    setVehicles(updated);
    for (const newV of updated) {
      const oldV = vehicles.find(v => v.ppu === newV.ppu);
      if (oldV) {
        if (JSON.stringify(oldV) !== JSON.stringify(newV)) {
          const docId = (oldV as any).id;
          if (docId) {
            const { id, ...dataToUpdate } = newV as any;
            await updateVehicle(docId, dataToUpdate);
          }
        }
      } else {
        await addVehicle(newV);
      }
    }
    for (const oldV of vehicles) {
      if (!updated.some(v => v.ppu === oldV.ppu)) {
        const docId = (oldV as any).id;
        if (docId) {
          await deleteVehicle(docId);
        }
      }
    }
  };

  const handleUpdateMaintenanceLogs = async (updated: MaintenanceLog[]) => {
    setMaintenanceLogs(updated);
    const added = updated.find(log => !maintenanceLogs.some(old => old.id === log.id));
    if (added) {
      const { id, ...data } = added as any;
      await addMaintenanceLog(data);
    }
  };

  const handleUpdateMovements = async (updated: FleetMovementLog[]) => {
    setMovementLogs(updated);
    const added = updated.find(m => !movementLogs.some(old => old.id === m.id));
    if (added) {
      const { id, ...data } = added as any;
      await addMovementLog(data);
    }
  };

  const handleUpdateIncidents = async (updated: Incident[]) => {
    setIncidents(updated);
    const added = updated.find(inc => !incidents.some(old => old.id === inc.id));
    if (added) {
      const { id, ...data } = added as any;
      await addIncident(data);
    } else {
      for (const newI of updated) {
        const oldI = incidents.find(i => i.id === newI.id);
        if (oldI && JSON.stringify(oldI) !== JSON.stringify(newI)) {
          const docId = (oldI as any).id;
          if (docId) {
            const { id, ...dataToUpdate } = newI as any;
            await updateIncident(docId, dataToUpdate);
          }
        }
      }
    }
  };

  const handleUpdateUsers = async (updated: UserRole[]) => {
    setUsers(updated);
    const added = updated.find(u => !users.some(old => old.email === u.email));
    if (added) {
      const { id, ...data } = added as any;
      await addUser(data);
    } else {
      for (const newU of updated) {
        const oldU = users.find(u => u.id === newU.id);
        if (oldU && JSON.stringify(oldU) !== JSON.stringify(newU)) {
          const docId = (oldU as any).id;
          if (docId) {
            const { id, ...dataToUpdate } = newU as any;
            await updateUser(docId, dataToUpdate);
          }
        }
      }
    }
  };

  const handleAddSupervisorLog = async (newLog: Omit<SupervisorFleetLog, 'id'>) => {
    await addSupervisorLog(newLog);
  };

  const handleAddWorkshopLog = async (newLog: Omit<WorkshopLog, 'id'>) => {
    await addWorkshopLog(newLog);
  };

  // Simulating live telemetry tick on map vehicles (speeds fluctuate gently to show real-time changes)
  useEffect(() => {
    const ticker = setInterval(() => {
      setVehicles(prev => {
        return prev.map(v => {
          if (v.estado === 'Operativo' && v.velocidad > 0) {
            const nextSpeed = Math.max(30, Math.min(120, v.velocidad + (Math.random() > 0.5 ? 4 : -4)));
            return {
              ...v,
              velocidad: nextSpeed
            };
          }
          return v;
        });
      });
    }, 4000);

    return () => clearInterval(ticker);
  }, []);

  const totalVehiclesCount = vehicles.length;
  const activeVehiclesCount = vehicles.filter(v => v.estado === 'Operativo').length;
  const maintenanceCount = vehicles.filter(v => v.estado === 'Mantenimiento').length;
  const incidentCount = vehicles.filter(v => v.estado === 'Siniestrado').length;

  // Compute urgent alerts feed
  const alertsFeed: { id: string; type: 'doc' | 'incident' | 'system'; text: string; time: string; severity: 'high' | 'medium' }[] = [];
  
  // 1. Doc alerts
  vehicles.forEach(v => {
    const today = new Date();
    const pcDiff = Math.ceil((new Date(v.documentos.permiso_circulacion.fecha_vencimiento).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const rtDiff = Math.ceil((new Date(v.documentos.revision_tecnica.fecha_vencimiento).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (pcDiff < 0) {
      alertsFeed.push({
        id: `alarm-pc-${v.ppu}`,
        type: 'doc',
        text: `Móvil ${v.codigo_unico} (${v.ppu}): Permiso de Circulación EXPIRADO el ${v.documentos.permiso_circulacion.fecha_vencimiento}.`,
        time: 'Antigüedad crítica',
        severity: 'high'
      });
    } else if (pcDiff <= 30) {
      alertsFeed.push({
        id: `alarm-pc-${v.ppu}`,
        type: 'doc',
        text: `Móvil ${v.codigo_unico} (${v.ppu}): Próximo a vencer Permiso de Circulación en ${pcDiff} días.`,
        time: 'Preventiva',
        severity: 'medium'
      });
    }

    if (rtDiff < 0) {
      alertsFeed.push({
        id: `alarm-rt-${v.ppu}`,
        type: 'doc',
        text: `Móvil ${v.codigo_unico} (${v.ppu}): Revisión Técnica EXPIRADA el ${v.documentos.revision_tecnica.fecha_vencimiento}. Transitado vial inhabilitado.`,
        time: 'Infracción grave',
        severity: 'high'
      });
    }
  });

  // 2. Incident alerts
  incidents.filter(i => i.estado_resolucion === 'Pendiente').forEach(inc => {
    alertsFeed.push({
      id: `alarm-inc-${inc.id}`,
      type: 'incident',
      text: `Siniestro Pendiente: Vehículo ${inc.codigo_vehiculo} (${inc.ppu}) reporta choque ${inc.tipo_incidente} con gravedad ${inc.gravedad}.`,
      time: 'Liquidación en curso',
      severity: inc.gravedad === 'Grave' ? 'high' : 'medium'
    });
  });

  // ── Guards de autenticación y carga ──────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center" id="auth-loading-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-slate-700 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSignIn={signIn} error={authError} loading={authLoading} />;
  }

  if (dataLoading || !currentSimulatedUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center" id="data-loading-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-slate-700 border-t-indigo-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Cargando datos de flota...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-slate-900 selection:text-white" id="main-application-container">
      
      {/* Dynamic Top-Simulation-Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-350 py-2 px-4 z-50">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-200">Acceso Administrativo</span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono uppercase">ISO-27001 Ready</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400">Cambiar perfil:</span>
            <div className="flex gap-1 overflow-x-auto p-0.5 bg-slate-950 rounded-lg border border-slate-800">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelectSimulatedUser(u)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all whitespace-nowrap ${
                    currentSimulatedUser.id === u.id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  id={`top-role-selector-${u.id}`}
                >
                  {u.rol}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-slate-800 hidden md:block" />
            <span className="italic text-slate-450 text-[11px] hidden md:inline">
              Perfil actual: <strong className="text-indigo-400">{currentSimulatedUser.nombre}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Sidebar & Content panel */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1400px] w-full mx-auto" id="main-split-layout">
        
        {/* Left Sidebar block */}
        <aside className="w-full md:w-64 shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col text-left" id="sidebar-panel">
          
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 font-display">
              <Truck className="w-5 h-5 text-slate-950" />
              <span>SCF <span className="font-normal text-slate-500">Flota</span></span>
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-wider font-bold mt-1 uppercase">Consola de Control</p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2 font-mono">Operaciones</div>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
              }`}
              id="tab-dashboard"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Tablero Control</span>
            </button>

            {currentSimulatedUser.permisos.ver_flota && (
              <button
                onClick={() => setActiveTab('inventario')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'inventario'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="tab-inventario"
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>Inventario Flota</span>
              </button>
            )}

            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 pt-6 mb-2 font-mono">Gestión logista</div>

            {currentSimulatedUser.permisos.mantenimientos && (
              <>
                <button
                  onClick={() => setActiveTab('mantenimientos')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'mantenimientos'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  id="tab-mantenimientos"
                >
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>Órdenes de Taller</span>
                </button>

                <button
                  onClick={() => setActiveTab('recepcion_taller')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'recepcion_taller'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  id="tab-recepcion-taller"
                >
                  <ClipboardCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Recepción de Taller</span>
                </button>

                <button
                  onClick={() => setActiveTab('salida_taller')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'salida_taller'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  id="tab-salida-taller"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Salida de Taller</span>
                </button>
              </>
            )}

            {currentSimulatedUser.permisos.movimientos_flota && (
              <button
                onClick={() => setActiveTab('movimientos')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'movimientos'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="tab-movimientos"
              >
                <ArrowRightLeft className="w-4 h-4 shrink-0" />
                <span>Bitácora Movimientos</span>
              </button>
            )}

            {currentSimulatedUser.permisos.incidentes_siniestros && (
              <button
                onClick={() => setActiveTab('incidentes')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'incidentes'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="tab-incidentes"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Siniestros e Incidentes</span>
              </button>
            )}

            {currentSimulatedUser.permisos.gestion_supervisores && (
              <button
                onClick={() => setActiveTab('supervisores')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'supervisores'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="tab-supervisores"
              >
                <Users className="w-4 h-4 shrink-0 animate-pulse" />
                <span>Gestión Supervisores</span>
              </button>
            )}

            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 pt-6 mb-2 font-mono">Reportes</div>

            <button
              onClick={() => setActiveTab('predictivo')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'predictivo'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
              }`}
              id="tab-predictivo"
            >
              <BrainCircuit className="w-4 h-4 text-emerald-650 shrink-0" />
              <span>Modelos e IA Predictiva</span>
            </button>

            {currentSimulatedUser.permisos.gestionar_usuarios && (
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'usuarios'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id="tab-usuarios"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Accesos Limitados</span>
              </button>
            )}
          </nav>

          {/* User profile bottom bar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 p-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-800 shrink-0">
                {currentSimulatedUser.nombre.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">{currentSimulatedUser.nombre}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate uppercase">{currentSimulatedUser.rol}</p>
              </div>
              <button
                onClick={() => signOut()}
                title="Cerrar sesión"
                id="btn-signout"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </aside>

        {/* Right Content Panel context */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50" id="main-content-panel">
          
          {/* Header block with Page Name and Quick Telemetry */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 md:px-8">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                {activeTab === 'dashboard' ? 'Tablero Control' : activeTab.replace('_', ' ')}
              </h2>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-650 text-[9px] font-bold rounded border border-emerald-100 font-mono tracking-wider uppercase">
                  DATABASE ONLINE
                </span>
              </div>
            </div>

            {/* Quick stats on large screen headers */}
            <div className="hidden lg:flex items-center gap-6" id="header-counters-telemetry">
              <div className="text-right">
                <span className="text-[9px] text-slate-450 uppercase font-bold tracking-wider font-mono block">En Ruta</span>
                <div className="text-xs font-bold text-slate-900 font-mono">{activeVehiclesCount} unidades</div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-450 uppercase font-bold tracking-wider font-mono block">En Taller</span>
                <div className="text-xs font-bold text-slate-900 font-mono">{maintenanceCount} unidades</div>
              </div>
            </div>
          </header>

          {/* Main Content viewport container */}
          <main className="flex-1 p-6 space-y-6 overflow-y-auto" id="application-main-stage">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                id="workspace-animate-frame"
              >
                {/* ROUTE 1: Tablero Central / Dashboard */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6 animate-fade-in" id="route-panel-dashboard">
                    
                    {/* Visual Banner introduction mimicking the Minimalism theme */}
                    <div className="bg-white p-6 rounded-2xl text-left border border-slate-200 shadow-sm text-slate-800">
                      <div className="max-w-4xl">
                        <div className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-[9px] uppercase font-bold tracking-widest text-slate-600 w-fit mb-3">
                          CONSOLA ACTIVA LOCAL • SEGURO Y COMPILADO
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display mb-1.5">
                          Administre, Audite y Monitoree su Flota
                        </h2>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Bienvenido al Sistema de Control de Flota oficial. Esta plataforma consolida la telemetría de sus proveedores de GPS (<strong className="text-slate-900">BlackGPS, Maxtracker, Webfleet</strong>), tarjetas de combustible, odómetros, y vigencia legal de documentación SOAP y revisión técnica.
                        </p>
                      </div>
                    </div>


                {/* Grid layout of alerts & statistics summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-statistics-layouts">
                  
                  {/* Left Column (2 spans): Primary metrics & map teaser */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Bento box stats summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">Flota Registrada</span>
                        <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{totalVehiclesCount}</div>
                        <span className="text-[10px] text-slate-500 mt-2 block">Unidades activas</span>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase text-emerald-600">Disponibles</span>
                        <div className="text-2xl font-extrabold font-mono text-emerald-600 mt-1">{activeVehiclesCount}</div>
                        <span className="text-[10px] text-slate-500 mt-2 block">Operativo vial</span>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase text-amber-600 font-sans">En Taller</span>
                        <div className="text-2xl font-extrabold font-mono text-amber-600 mt-1">{maintenanceCount}</div>
                        <span className="text-[10px] text-slate-500 mt-2 block">Bitácora activa</span>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase text-rose-500">Siniestrados</span>
                        <div className="text-2xl font-extrabold font-mono text-rose-600 mt-1">{incidentCount}</div>
                        <span className="text-[10px] text-slate-500 mt-2 block">Seguro en curso</span>
                      </div>
                    </div>

                    {/* Quick audits download triggers block */}
                    <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200/60 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Auditoría Logística de Flota Regulada</h4>
                        <p className="text-xs text-slate-500 mt-1">Descargue la base de datos oficial cifrada para inspecciones del Ministerio de Planificación.</p>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        {currentSimulatedUser.permisos.descargar_auditoria ? (
                          <>
                            <button
                              onClick={() => exportToExcel(vehicles)}
                              className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 border border-slate-250 rounded-lg inline-flex items-center gap-1.5 transition-all flex-1 sm:flex-initial"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                              Planilla Excel
                            </button>
                            <button
                              onClick={() => triggerPDFPrint(vehicles)}
                              className="bg-slate-950 text-white hover:bg-slate-900 text-xs font-bold py-2 px-3 rounded-lg inline-flex items-center gap-1.5 transition-all flex-1 sm:flex-initial"
                            >
                              <FileText className="w-4 h-4 text-indigo-400" />
                              Imprimir PDF
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic bg-white px-3 py-2 border border-slate-200 rounded-lg">
                            Descargas deshabilitadas en rol actual
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dashboard Widget: Control de Supervisores (Rendimiento y Plazos) */}
                    {currentSimulatedUser.permisos.gestion_supervisores && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left space-y-4 shadow-sm" id="widget-control-supervisores">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600 animate-pulse" />
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Control de Supervisores (KPI Combustible)</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">Odómetros y rendimientos de combustible actualizados semanalmente</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab('supervisores')}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Ir a Panel de Supervisores →
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Reportes Recientes</span>
                            <div className="font-mono font-extrabold text-lg text-slate-900 mt-1">
                              {vehicles.filter(v => 
                                supervisorLogs.some(log => log.ppu === v.ppu && new Date(log.fecha_actualizacion).getTime() >= (Date.now() - 7 * 24 * 60 * 60 * 1000))
                              ).length} / {vehicles.length}
                            </div>
                            <span className="text-[9px] text-slate-500 font-medium font-sans">Patentes con odómetro actualizado</span>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-0.5">
                              <Fuel className="w-3 h-3 text-orange-500" /> COPEC Consolidado
                            </span>
                            <div className="font-mono font-extrabold text-base text-orange-600 mt-1">
                              ${supervisorLogs.reduce((sum, l) => l.combustible?.proveedor === 'Copec' ? sum + l.combustible.monto_total : sum, 0).toLocaleString()}
                            </div>
                            <span className="text-[9px] text-slate-500 font-sans block">Total declaraciones</span>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-0.5">
                              <Fuel className="w-3 h-3 text-blue-500" /> SHELL Consolidado
                            </span>
                            <div className="font-mono font-extrabold text-base text-blue-650 mt-1">
                              ${supervisorLogs.reduce((sum, l) => l.combustible?.proveedor === 'Shell' ? sum + l.combustible.monto_total : sum, 0).toLocaleString()}
                            </div>
                            <span className="text-[9px] text-slate-500 font-sans block">Total declaraciones</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right Column (1 span): Live system alarms feed */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <AlertTriangle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                          Alarmas Operacionales
                        </h3>
                        <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {alertsFeed.length} alertas
                        </span>
                      </div>

                      <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1" id="alarms-timeline-feed">
                        {alertsFeed.length === 0 ? (
                          <div className="py-12 py-auto text-center text-slate-400 text-xs italic">
                            No se registran alarmas pendientes de resolución reglamentaria.
                          </div>
                        ) : (
                          alertsFeed.map((alarm, idx) => (
                            <div 
                              key={idx} 
                              className={`p-3 rounded-xl border flex gap-3 ${
                                alarm.severity === 'high' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                              }`}
                            >
                              <div className="mt-0.5">
                                <AlertTriangle className={`w-4 h-4 ${alarm.severity === 'high' ? 'text-rose-600' : 'text-amber-650'}`} />
                              </div>
                              <div className="text-left flex-1">
                                <p className={`text-xs font-semibold leading-tight ${alarm.severity === 'high' ? 'text-rose-950 font-sans' : 'text-slate-800'}`}>
                                  {alarm.text}
                                </p>
                                <span className={`text-[9px] block mt-1 uppercase font-bold tracking-wider ${alarm.severity === 'high' ? 'text-rose-700' : 'text-amber-700'}`}>
                                  {alarm.time}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[10px] text-slate-500 mt-4 leading-relaxed">
                      <strong>Protocolo SOAP & RT Chileno:</strong> Las alertas se desencadenan automáticamente cuando un vehículo carece del documento en formato digital PDF, o bien su vigencia caducó respecto a la fecha actual del sistema.
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ROUTE 3: Vehicle inventory ledgers */}
            {activeTab === 'inventario' && currentSimulatedUser.permisos.ver_flota && (
              <VehicleInventory
                vehicles={vehicles}
                onUpdateVehicles={handleUpdateVehicles}
                permissions={currentSimulatedUser.permisos}
                customCategories={customCategories}
                onCreateCategory={(newCat) => setCustomCategories([...customCategories, newCat])}
              />
            )}

            {/* ROUTE 4: Maintenance Service Log */}
            {activeTab === 'mantenimientos' && currentSimulatedUser.permisos.mantenimientos && (
              <WithPermission permission="mantenimientos" currentSimulatedUser={currentSimulatedUser} setActiveTab={setActiveTab}>
                <MaintenanceTab
                  logs={maintenanceLogs}
                  vehicles={vehicles}
                  onUpdateLogs={handleUpdateMaintenanceLogs}
                  permissions={currentSimulatedUser.permisos}
                />
              </WithPermission>
            )}

            {/* ROUTE Recepcion Taller */}
            {activeTab === 'recepcion_taller' && currentSimulatedUser.permisos.mantenimientos && (
              <WithPermission permission="mantenimientos" currentSimulatedUser={currentSimulatedUser} setActiveTab={setActiveTab}>
                <WorkshopTab
                  mode="recepcion"
                  vehicles={vehicles}
                  onUpdateVehicles={handleUpdateVehicles}
                  logs={workshopLogs}
                  onAddWorkshopLog={handleAddWorkshopLog}
                  currentUser={currentSimulatedUser}
                />
              </WithPermission>
            )}

            {/* ROUTE Salida Taller */}
            {activeTab === 'salida_taller' && currentSimulatedUser.permisos.mantenimientos && (
              <WithPermission permission="mantenimientos" currentSimulatedUser={currentSimulatedUser} setActiveTab={setActiveTab}>
                <WorkshopTab
                  mode="salida"
                  vehicles={vehicles}
                  onUpdateVehicles={handleUpdateVehicles}
                  logs={workshopLogs}
                  onAddWorkshopLog={handleAddWorkshopLog}
                  currentUser={currentSimulatedUser}
                />
              </WithPermission>
            )}

            {/* ROUTE 5: Fleet Movements contracts bitacora */}
            {activeTab === 'movimientos' && currentSimulatedUser.permisos.movimientos_flota && (
              <WithPermission permission="movimientos_flota" currentSimulatedUser={currentSimulatedUser} setActiveTab={setActiveTab}>
                <MovementsTab
                  movements={movementLogs}
                  vehicles={vehicles}
                  onUpdateMovements={handleUpdateMovements}
                  onUpdateVehicles={handleUpdateVehicles}
                  permissions={currentSimulatedUser.permisos}
                  currentSimulatedAdminUser={currentSimulatedUser.nombre}
                />
              </WithPermission>
            )}

            {/* ROUTE 6: Log road accidents / incident register */}
            {activeTab === 'incidentes' && currentSimulatedUser.permisos.incidentes_siniestros && (
              <WithPermission permission="incidentes_siniestros" currentSimulatedUser={currentSimulatedUser} setActiveTab={setActiveTab}>
                <IncidentsTab
                  incidents={incidents}
                  vehicles={vehicles}
                  onUpdateIncidents={handleUpdateIncidents}
                  onUpdateVehicles={handleUpdateVehicles}
                  permissions={currentSimulatedUser.permisos}
                />
              </WithPermission>
            )}

            {/* ROUTED 7: Predictive intelligence and reporting */}
            {activeTab === 'predictivo' && (
              <PredictiveAnalytics
                vehicles={vehicles}
                maintenanceLogs={maintenanceLogs}
              />
            )}

            {/* ROUTE 8: Access matrix switch and creation */}
            {activeTab === 'usuarios' && currentSimulatedUser.permisos.gestionar_usuarios && (
              <WithPermission permission="gestionar_usuarios" currentSimulatedUser={currentSimulatedUser} setActiveTab={setActiveTab}>
                <PermissionsManager
                  users={users}
                  onUpdateUsers={handleUpdateUsers}
                  currentUserRole={currentSimulatedUser}
                  onSelectActiveSimulatedUser={handleSelectSimulatedUser}
                />
              </WithPermission>
            )}

            {/* ROUTE 9: Gestión de Supervisores */}
            {activeTab === 'supervisores' && currentSimulatedUser.permisos.gestion_supervisores && (
              <WithPermission permission="gestion_supervisores" currentSimulatedUser={currentSimulatedUser} setActiveTab={setActiveTab}>
                <SupervisorsTab
                  vehicles={vehicles}
                  onUpdateVehicles={handleUpdateVehicles}
                  currentUser={currentSimulatedUser}
                  logs={supervisorLogs}
                  onAddSupervisorLog={handleAddSupervisorLog}
                />
              </WithPermission>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer layout bounds */}
      <footer className="bg-white border-t border-slate-100 py-6 shrink-0 text-slate-400 text-xs text-center" id="platform-footer-credits">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Sistema de Control de Flota - Version de Prueba para Nera Chile SPA</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-650 transition">Auditoría Interna</span>
            <span className="hover:text-slate-650 transition">Soporte Operacional</span>
            <span className="hover:text-slate-650 transition">Cifrado de Extremo a Extremo (AES-256)</span>
          </div>
        </div>
      </footer>

        </div>
      </div>

    </div>
  );
}

// Fallback visual helper block to warn if some user does not possess specific permission rendering
function WithPermission({
  permission,
  currentSimulatedUser,
  setActiveTab,
  children
}: {
  permission: keyof UserPermissions;
  currentSimulatedUser: UserRole;
  setActiveTab: (tab: string) => void;
  children: React.ReactElement;
}) {
  const hasPerm = currentSimulatedUser.permisos[permission];
  if (!hasPerm) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-full">
            <Lock className="w-8 h-8" />
          </div>
        </div>
        <h3 className="font-extrabold text-slate-900 text-base">Acceso Restringido</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Su cuenta actual (<strong className="text-slate-800">{currentSimulatedUser.nombre}</strong>) no tiene asignada la opción de <strong className="text-indigo-600">{String(permission).replace('_', ' ')}</strong> en la matriz de accesos.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-5 rounded-lg transition-all"
          >
            Volver al Tablero Principal
          </button>
        </div>
      </div>
    );
  }
  return children;
}

