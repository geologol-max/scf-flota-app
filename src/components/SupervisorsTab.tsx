import React, { useState, useEffect } from 'react';
import { Vehicle, UserRole, SupervisorFleetLog, SupervisorFuelLoad } from '../types';
import {
  Clock,
  Plus,
  Check,
  AlertTriangle,
  Calendar,
  Download,
  Search,
  Fuel,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  Coins,
  Gauge
} from 'lucide-react';
import { exportSupervisorFleetToExcel, exportSupervisorFleetToPDF } from '../utils/supervisorExporters';

interface SupervisorsTabProps {
  vehicles: Vehicle[];
  onUpdateVehicles: (updated: Vehicle[]) => void;
  currentUser: UserRole;
}

export default function SupervisorsTab({
  vehicles,
  onUpdateVehicles,
  currentUser
}: SupervisorsTabProps) {
  // Persistence state for supervisor logs
  const [logs, setLogs] = useState<SupervisorFleetLog[]>(() => {
    const saved = localStorage.getItem('supervisor_fleet_logs');
    if (saved) return JSON.parse(saved);
    // Initial mock log updates of past periods for realistic visualization
    return [
      {
        id: 'SUP-001',
        ppu: 'ABCD12',
        fecha_actualizacion: '2026-06-15 11:30',
        odometro: 120500,
        combustible: {
          fecha: '2026-06-15',
          hora: '11:00',
          proveedor: 'Copec',
          litros: 45,
          valor_combustible: 1120,
          monto_total: 50400,
          observaciones: 'Carga regular para ruta sur'
        },
        observaciones: 'Mantención realizada la semana pasada.',
        periodoId: '2026-06-19',
        supervisor_nombre: 'Eduardo Garrido',
        contrato: 'AVO'
      },
      {
        id: 'SUP-002',
        ppu: 'HGTR45',
        fecha_actualizacion: '2026-06-17 09:45',
        odometro: 89400,
        combustible: {
          fecha: '2026-06-17',
          hora: '09:30',
          proveedor: 'Shell',
          litros: 50,
          valor_combustible: 1140,
          monto_total: 57000,
          observaciones: 'Carga estanque completo'
        },
        observaciones: 'Sin novedades mecánicas.',
        periodoId: '2026-06-19',
        supervisor_nombre: 'Carolina Méndez',
        contrato: 'ISA MAIPO'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('supervisor_fleet_logs', JSON.stringify(logs));
  }, [logs]);

  // Available contracts for dropdown filtering
  const allContracts = ['AVO', 'ISA MAIPO', 'RUTA DE LA FRUTA', 'NAHUELBUTA', 'CONG', 'PUENTE INDUSTRIAL', 'FEPASA', 'AUTOPISTA CENTRAL', 'AVN-TSC'];
  
  // Decide active contracts managed by selected user
  const isSupervisor = currentUser.rol === 'Supervisor';
  const supervisorAssignedContracts = currentUser.contratos_supervisor || [];
  
  const [selectedContract, setSelectedContract] = useState<string>(() => {
    if (isSupervisor && supervisorAssignedContracts.length > 0) {
      return supervisorAssignedContracts[0];
    }
    return 'AVO';
  });

  // Sync if current simulated user changes
  useEffect(() => {
    if (isSupervisor && supervisorAssignedContracts.length > 0) {
      setSelectedContract(supervisorAssignedContracts[0]);
    }
  }, [currentUser]);

  // State to track selected PPU in the unified form
  const [formPpu, setFormPpu] = useState<string>('');

  // General searching filters
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);

  // Form states
  const [newOdometer, setNewOdometer] = useState<string>('');
  const [hasFuel, setHasFuel] = useState<boolean>(false);
  const [fuelProvider, setFuelProvider] = useState<'Copec' | 'Shell'>('Copec');
  const [fuelDate, setFuelDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [fuelTime, setFuelTime] = useState<string>('12:00');
  const [fuelLitres, setFuelLitres] = useState<string>('');
  const [fuelPricePerLitre, setFuelPricePerLitre] = useState<string>('');
  const [fuelObservations, setFuelObservations] = useState<string>('');
  const [generalObservations, setGeneralObservations] = useState<string>('');

  // Sync selected formula PPU whenever contract changes
  useEffect(() => {
    const matched = vehicles.filter(v => v.contrato === selectedContract);
    if (matched.length > 0) {
      const exists = matched.find(v => v.ppu === formPpu);
      if (!exists) {
        setFormPpu(matched[0].ppu);
        setNewOdometer(String(matched[0].kilometraje));
      }
    } else {
      setFormPpu('');
      setNewOdometer('');
    }
  }, [selectedContract, vehicles]);

  // Handler to safely change PPU in dropdown and sync odometer fields
  const handleFormPpuChange = (ppu: string) => {
    setFormPpu(ppu);
    const selectedVeh = vehicles.find(v => v.ppu === ppu);
    if (selectedVeh) {
      setNewOdometer(String(selectedVeh.kilometraje));
    } else {
      setNewOdometer('');
    }
  };

  // Auto-calculate fuel total CLP amount if price and litres are inputted
  const computedFuelTotal = Number(fuelLitres) && Number(fuelPricePerLitre)
    ? Math.round(Number(fuelLitres) * Number(fuelPricePerLitre))
    : 0;

  // Countdown clock state
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [timeStatusAlert, setTimeStatusAlert] = useState<{ text: string; color: string }>({ text: '', color: '' });
  const [nowDate, setNowDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute countdown & status details
  useEffect(() => {
    const status = getWeeklySchedule(nowDate);
    setTimeLeftStr(status.timeLeftString);
    setTimeStatusAlert({
      text: status.statusMessage,
      color: status.accentColor
    });
  }, [nowDate]);

  // Helper calculation for schedule
  function getWeeklySchedule(now: Date) {
    const day = now.getDay(); // 0 Sunday, 1 Monday, ... 6 Saturday
    
    // Find current week's Monday 09:00 AM
    const currentMonday = new Date(now);
    const diffToMonday = day === 0 ? -6 : 1 - day;
    currentMonday.setDate(now.getDate() + diffToMonday);
    currentMonday.setHours(9, 0, 0, 0);

    // Find this Friday 10:00 AM
    const currentFriday = new Date(currentMonday);
    currentFriday.setDate(currentMonday.getDate() + 4);
    currentFriday.setHours(10, 0, 0, 0);

    const timeToFriday = currentFriday.getTime() - now.getTime();
    const timeSinceMonday = now.getTime() - currentMonday.getTime();

    const isWindowOpen = timeSinceMonday >= 0 && timeToFriday >= 0;

    let timeLeftString = '';
    let statusMessage = '';
    let accentColor = '';

    if (isWindowOpen) {
      // Countdown to Friday 10:00 AM
      const diffMs = timeToFriday;
      const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secsLeft = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      timeLeftString = `${daysLeft}d ${hoursLeft}h ${minsLeft}m ${secsLeft}s`;
      statusMessage = '⚠️ Plazo abierto para actualización semanal (Límite: Viernes 10:00 AM)';
      accentColor = 'amber';
    } else if (now.getTime() < currentMonday.getTime()) {
      // Weekend / Monday morning gap (Friday 10:01 AM to Monday 8:59 AM)
      const diffMs = currentMonday.getTime() - now.getTime();
      const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      timeLeftString = `Abre en ${daysLeft}d ${hoursLeft}h ${minsLeft}m`;
      statusMessage = '🔒 Fuera de plazo. El próximo ciclo de envío se habilitará el lunes a las 09:00 AM.';
      accentColor = 'slate';
    } else {
      // Past Friday 10:00 AM of this week
      // The deadline for this week's update is overdue
      const nextMonday = new Date(currentMonday);
      nextMonday.setDate(currentMonday.getDate() + 7);
      const diffMs = nextMonday.getTime() - now.getTime();
      const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      timeLeftString = `Finalizado. Abre el lunes (${daysLeft}d ${hoursLeft}h)`;
      statusMessage = '🛑 Plazo CERRADO. El plazo semanal venció el Viernes a las 10:00 AM.';
      accentColor = 'rose';
    }

    return {
      timeLeftString,
      statusMessage,
      accentColor,
      currentMonday,
      currentFriday
    };
  }

  // Get active cycle bounds to see which vehicles have logged matching updates this week
  const cycle = getWeeklySchedule(nowDate);
  const cycleFridayStr = cycle.currentFriday.toISOString().slice(0, 10);

  // Filter vehicles belonging to the selected contract
  const contractVehicles = vehicles.filter(v => v.contrato === selectedContract);

  // Search filter
  const filteredVehicles = contractVehicles.filter(v => {
    const searchLower = searchTerm.toLowerCase();
    return (
      v.ppu.toLowerCase().includes(searchLower) ||
      v.codigo_unico.toLowerCase().includes(searchLower) ||
      v.marca.toLowerCase().includes(searchLower) ||
      v.modelo.toLowerCase().includes(searchLower)
    );
  });

  // Check update status for a vehicle in this week's active cycle [Monday 09:00 AM - Friday 10:00 AM]
  const getVehicleUpdateStatus = (ppu: string) => {
    // Find logs this week
    const thisWeekLogs = logs.filter(l => {
      if (l.ppu !== ppu) return false;
      const logTime = new Date(l.fecha_actualizacion).getTime();
      return logTime >= cycle.currentMonday.getTime();
    });

    const isUpdated = thisWeekLogs.length > 0;
    const isPastDeadline = nowDate.getTime() > cycle.currentFriday.getTime();

    if (isUpdated) {
      return { code: 'green', text: 'Actualizado', date: thisWeekLogs[0].fecha_actualizacion };
    } else {
      if (isPastDeadline) {
        return { code: 'red', text: 'Atrasado / Falta Reportar', date: null };
      } else {
        return { code: 'yellow', text: 'Pendiente', date: null };
      }
    }
  };

  // KPI Calculations for selected contract fleet
  const totalOdometers = contractVehicles.reduce((sum, v) => sum + v.kilometraje, 0);

  // Shell and Copec expenditure for the SELECTED CONTRACT's logs
  const contractLogs = logs.filter(l => l.contrato === selectedContract);
  const spentCopec = contractLogs.reduce((sum, l) => {
    if (l.combustible?.proveedor === 'Copec') {
      return sum + l.combustible.monto_total;
    }
    return sum;
  }, 0);

  const spentShell = contractLogs.reduce((sum, l) => {
    if (l.combustible?.proveedor === 'Shell') {
      return sum + l.combustible.monto_total;
    }
    return sum;
  }, 0);

  // Verify maintenance indicator (warn if km is nearing an interval of 10,000 km, e.g. within 1000 km)
  // or simple visual trigger of overdue
  const countMaintenanceNearing = contractVehicles.filter(v => {
    const remainingToNextService = 10000 - (v.kilometraje % 10000);
    return remainingToNextService <= 1000;
  }).length;

  // Track compliance statistics for selected contract
  const vehiclesUpdatedThisWeek = contractVehicles.filter(v => getVehicleUpdateStatus(v.ppu).code === 'green').length;
  const isFullyUpdated = contractVehicles.length > 0 && vehiclesUpdatedThisWeek === contractVehicles.length;

  // Handle saving new supervisor report
  const handleSaveReport = (ppu: string) => {
    const odometerNum = Number(newOdometer);
    const selectedVeh = vehicles.find(v => v.ppu === ppu);

    if (!selectedVeh) return;

    if (!odometerNum || odometerNum <= 0) {
      alert('Por favor ingrese un odómetro de kilometraje válido.');
      return;
    }

    if (odometerNum < selectedVeh.kilometraje) {
      const confirmLower = window.confirm(`El kilometraje ingresado (${odometerNum.toLocaleString()} km) es inferior al actual registrado en el sistema (${selectedVeh.kilometraje.toLocaleString()} km). ¿Está seguro de guardar este valor?`);
      if (!confirmLower) return;
    }

    let fuelInfo: SupervisorFuelLoad | undefined = undefined;
    if (hasFuel) {
      const litresNum = Number(fuelLitres);
      const priceNum = Number(fuelPricePerLitre);

      if (!fuelDate || !fuelTime) {
        alert('Ingrese fecha y hora para el registro de combustible.');
        return;
      }
      if (!litresNum || litresNum <= 0) {
        alert('Ingrese la cantidad de litros de combustible.');
        return;
      }
      if (!priceNum || priceNum <= 0) {
        alert('Ingrese el valor por litro de combustible.');
        return;
      }

      fuelInfo = {
        fecha: fuelDate,
        hora: fuelTime,
        proveedor: fuelProvider,
        litros: litresNum,
        valor_combustible: priceNum,
        monto_total: computedFuelTotal,
        observaciones: fuelObservations.trim()
      };
    }

    // Capture exact updated date/time
    const timestampStr = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }).slice(0, 16).replace(',', '');
    const newLog: SupervisorFleetLog = {
      id: `SUP-${Date.now().toString().slice(-6)}`,
      ppu: ppu,
      fecha_actualizacion: timestampStr,
      odometro: odometerNum,
      combustible: fuelInfo,
      observaciones: generalObservations.trim() || undefined,
      periodoId: cycleFridayStr,
      supervisor_nombre: currentUser.nombre,
      contrato: selectedContract
    };

    // Append to logs
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);

    // Update main vehicle mileage state
    const updatedVehicles = vehicles.map(v => {
      if (v.ppu === ppu) {
        return {
          ...v,
          kilometraje: odometerNum
        };
      }
      return v;
    });
    onUpdateVehicles(updatedVehicles);

    // Reset state and collapse
    setExpandedVehicle(null);
    setNewOdometer('');
    setHasFuel(false);
    setFuelLitres('');
    setFuelPricePerLitre('');
    setFuelObservations('');
    setGeneralObservations('');

    alert(`¡Reporte guardado con éxito para patente ${ppu}!`);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="supervisor-panel-tab">
      
      {/* Intro Panel banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left relative overflow-hidden">
        <div className="max-w-4xl">
          <div className="bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider w-fit mb-3 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            Módulo Autónomo de Supervisión
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display mb-1.5">
            Portal Gestor de Contratos y Rendimientos
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Herramienta diseñada exclusivamente para los supervisores en terreno. Registre el odómetro semanal y cargue las boletas/tickets de suministro <strong className="font-semibold text-slate-800">Shell o Copec</strong> de cada patente vinculada a sus contratos autorizados. Esta información alimenta automáticamente los KPI logísticos globales.
          </p>
        </div>
      </div>

      {/* Countdown and compliance status banner */}
      <div 
        className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left ${
          cycle.accentColor === 'rose'
            ? 'bg-rose-50 border-rose-100 text-rose-900'
            : cycle.accentColor === 'amber'
            ? 'bg-amber-50/70 border-amber-100 text-amber-900'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}
        id="weekly-countdown-banner"
      >
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${
            cycle.accentColor === 'rose'
              ? 'bg-rose-200/50 text-rose-700'
              : cycle.accentColor === 'amber'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-200/60 text-slate-600'
          }`}>
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider">Compromiso de Actualización Semanal</h4>
            <p className="text-xs font-semibold mt-1">
              {timeStatusAlert.text}
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              Rango de declaración: Lunes 09:00 AM hasta Viernes 10:00 AM (una vez por semana).
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xs px-4 py-3 rounded-xl border border-white/20 text-center shadow-xs min-w-[170px] self-stretch md:self-auto flex flex-col justify-center">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block">Tiempo Límite</span>
          <span className="text-sm font-extrabold font-mono text-slate-900 tracking-tight mt-0.5">
            {timeLeftStr || 'Calculando...'}
          </span>
        </div>
      </div>

      {/* Contract & Simulation switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-xs">
        <div className="flex gap-2.5 items-center">
          <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">Contrato Activo:</span>
          {isSupervisor ? (
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border">
                {selectedContract}
              </span>
              <span className="text-[11px] text-slate-450 italic">
                (Contrato restringido por su perfil de Supervisor)
              </span>
            </div>
          ) : (
            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              className="p-1 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 font-bold text-slate-850 focus:border-slate-400 focus:outline-none"
              id="supervisor-contract-filter"
            >
              {allContracts.map(c => (
                <option key={c} value={c}>Contrato {c}</option>
              ))}
            </select>
          )}
        </div>

        {/* Dynamic simulation helper */}
        <div className="text-right text-[11px] text-slate-500">
          Rol actual: <strong className="text-indigo-600 uppercase font-extrabold font-mono">{currentUser.rol}</strong> ({currentUser.nombre})
        </div>
      </div>

      {/* KPI Cards section based on selected contract fleet */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="supervisor-bento-kpis">
        
        {/* Compliance counter card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left relative overflow-hidden shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Cumplimiento del Plazo</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-900">
              {vehiclesUpdatedThisWeek}/{contractVehicles.length}
            </span>
            <span className="text-xs text-slate-500">unidades</span>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${isFullyUpdated ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span className={`text-[10px] font-bold uppercase ${isFullyUpdated ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isFullyUpdated ? 'Al día 100% (' + selectedContract + ')' : 'Pendientes de reporte'}
            </span>
          </div>
        </div>

        {/* Total contract fleet odometer mileage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider col-span-1">Odómetro Total Contrato</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1.5">
            {totalOdometers.toLocaleString()} km
          </div>
          <span className="text-[10px] text-slate-500 mt-3 block">Suma del odómetro en {contractVehicles.length} vehículos.</span>
        </div>

        {/* Copec expenditure */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-orange-500" />
              Consumo COPEC Contrato
            </span>
            <div className="text-2xl font-extrabold font-mono text-orange-600 mt-1.5">
              ${spentCopec.toLocaleString()} CLP
            </div>
          </div>
          <span className="text-[9px] text-slate-450 uppercase font-mono font-bold block mt-3">Suministro Tarjetas Copec</span>
        </div>

        {/* Shell expenditure */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-blue-500" />
              Consumo SHELL Contrato
            </span>
            <div className="text-2xl font-extrabold font-mono text-blue-600 mt-1.5">
              ${spentShell.toLocaleString()} CLP
            </div>
          </div>
          <span className="text-[9px] text-slate-450 uppercase font-mono font-bold block mt-3">Suministro Tarjetas Shell</span>
        </div>

      </div>

      {/* Formulario Unificado para Carga de Reportes Semanales (Odómetros y Combustibles) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left space-y-4" id="unified-supervisor-report-form">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-wider w-fit flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Reporte de Terreno
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Declarar Odómetro y Consumo Semanal ({selectedContract})</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 self-start sm:self-auto">Periodo Actual: {cycleFridayStr}</span>
        </div>

        {contractVehicles.length === 0 ? (
          <div className="p-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
            No se registran vehículos activos asignados bajo el contrato de arrendamiento logístico "{selectedContract}" para reportar telemetría.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Columna 1: Selección de Patente y Odómetro */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50/50 border border-slate-150/70 rounded-xl space-y-3.5">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">1. Unidad & Kilometraje</span>
                
                <div>
                  <label htmlFor="form-select-ppu" className="text-[10px] text-slate-700 uppercase font-bold block mb-1">Patente PPU*</label>
                  <select
                    id="form-select-ppu"
                    value={formPpu}
                    onChange={(e) => handleFormPpuChange(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-lg bg-white shadow-xs focus:ring-1 focus:ring-slate-950 focus:outline-none"
                  >
                    {contractVehicles.map(v => (
                      <option key={v.ppu} value={v.ppu}>
                        {v.ppu} — {v.marca} {v.modelo}
                      </option>
                    ))}
                  </select>
                </div>

                {formPpu && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[9px] text-slate-450 uppercase font-extrabold block mb-1">Odómetro Actual</span>
                      <div className="font-mono text-xs font-bold text-slate-500 bg-slate-100/80 p-2 rounded-lg border border-slate-200">
                        {(vehicles.find(v => v.ppu === formPpu)?.kilometraje || 0).toLocaleString()} km
                      </div>
                    </div>
                    <div>
                      <label htmlFor="form-new-odometer" className="text-[9px] text-slate-700 uppercase font-bold block mb-1">Nuevo Odómetro*</label>
                      <div className="relative">
                        <input
                          type="number"
                          id="form-new-odometer"
                          value={newOdometer}
                          onChange={(e) => setNewOdometer(e.target.value)}
                          className="w-full text-xs font-mono font-bold p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-950 focus:outline-none bg-white shadow-xs"
                          placeholder="Ingrese km actual"
                        />
                        <span className="absolute right-2 top-2 text-[9px] text-slate-400 font-extrabold">KM</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/50 border border-slate-150/70 rounded-xl">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block mb-2">3. Observaciones / Novedades</span>
                <textarea
                  rows={2}
                  value={generalObservations}
                  onChange={(e) => setGeneralObservations(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-950 focus:outline-none bg-white shadow-xs"
                  placeholder="Ej: Neumáticos con desgaste leve, parabrisas trizado o comentarios de la unidad..."
                />
              </div>
            </div>

            {/* Columna 2 y 3: Combustible y Ticketera */}
            <div className="md:col-span-2">
              <div className="p-4 bg-slate-50/50 border border-slate-150/70 rounded-xl space-y-4 h-full flex flex-col justify-between">
                
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-slate-500" />
                    2. Cargar Consumo Combustible
                  </span>
                  
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                    <input
                      type="checkbox"
                      id="form-has-fuel"
                      checked={hasFuel}
                      onChange={(e) => setHasFuel(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-200 rounded focus:ring-indigo-550 cursor-pointer"
                    />
                    <label htmlFor="form-has-fuel" className="text-xs font-bold text-indigo-700 cursor-pointer select-none">Registrar Boleta</label>
                  </div>
                </div>

                {hasFuel ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 flex-1">
                    
                    {/* Suministrador */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-slate-700 uppercase font-bold block mb-1">Suministrador*</label>
                        <select
                          value={fuelProvider}
                          onChange={(e) => setFuelProvider(e.target.value as 'Copec' | 'Shell')}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white shadow-xs font-bold focus:outline-none focus:border-slate-400"
                        >
                          <option value="Copec">COPEC</option>
                          <option value="Shell">SHELL</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-700 uppercase font-bold block mb-1">Costo Total Declarado</span>
                        <div className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50/80 p-2 rounded-lg border border-emerald-150 text-right">
                          $ {computedFuelTotal.toLocaleString()} CLP
                        </div>
                      </div>
                    </div>

                    {/* Litros y Precio */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-slate-750 uppercase font-bold block mb-1">Litros Suministrados*</label>
                        <input
                          type="number"
                          step="any"
                          value={fuelLitres}
                          onChange={(e) => setFuelLitres(e.target.value)}
                          className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg bg-white shadow-xs focus:outline-none"
                          placeholder="Ej: 45.3"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-750 uppercase font-bold block mb-1">Precio Unitario ($/Litro)*</label>
                        <input
                          type="number"
                          value={fuelPricePerLitre}
                          onChange={(e) => setFuelPricePerLitre(e.target.value)}
                          className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg bg-white shadow-xs focus:outline-none"
                          placeholder="Ej: 1140"
                        />
                      </div>
                    </div>

                    {/* Fecha/Hora y Ticketera */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Fecha Carga</label>
                          <input
                            type="date"
                            value={fuelDate}
                            onChange={(e) => setFuelDate(e.target.value)}
                            className="w-full text-[10px] p-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Hora Carga</label>
                          <input
                            type="time"
                            value={fuelTime}
                            onChange={(e) => setFuelTime(e.target.value)}
                            className="w-full text-[10px] p-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Nº Transacción / Boleta</label>
                        <input
                          type="text"
                          value={fuelObservations}
                          onChange={(e) => setFuelObservations(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white shadow-xs focus:outline-none"
                          placeholder="Ej: Ticket N° 19485"
                        />
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-6 bg-white/50">
                    <Fuel className="w-7 h-7 text-slate-300 stroke-1.25 mb-1.5" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sin transacción de Combustible</p>
                    <p className="text-[9px] text-slate-450 mt-0.5 max-w-xs">Habilite "Registrar Boleta" para computar los litros y el costo del suministro de esta semana.</p>
                  </div>
                )}

                {/* Submit button inside the columns block */}
                <div className="pt-3 border-t border-slate-200/50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveReport(formPpu)}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-2.5 px-6 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                    id="submit-form-supervisores-top"
                  >
                    <Check className="w-4 h-4 text-indigo-400" />
                    <span>Guardar Reporte Semanal en Bitácora</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>

      {/* Fleet Alert - Servicemetro Warnings */}
      {countMaintenanceNearing > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-650" />
            <div>
              <h5 className="font-bold text-xs text-amber-900">Alerta de Próximas Mantenciones ({selectedContract})</h5>
              <p className="text-[11px] text-amber-850 mt-0.5">
                Hay {countMaintenanceNearing} vehículos en su contrato que están a menos de 1.000 km de cumplir un múltiplo de 10.000 km. Considere agendar visitas de taller.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary fleet table view with updates trigger and downloads */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" id="supervisor-fleet-table-ledger">
        
        {/* Table controls header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar patente o código de flota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            {isFullyUpdated ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs">
                <Check className="w-3.5 h-3.5" />
                ¡Flota Reportada con Éxito!
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-150 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                Reportes pendientes
              </span>
            )}
            
            <button
              onClick={() => exportSupervisorFleetToExcel(contractVehicles, logs, selectedContract)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-2 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              title="Descargar Planilla Excel de Reportes"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => exportSupervisorFleetToPDF(contractVehicles, logs, selectedContract, currentUser.nombre)}
              className="bg-slate-900 hover:bg-slate-800 text-white p-2 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              title="Imprimir PDF de Operación"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Imprimir PDF</span>
            </button>
          </div>
        </div>

        {/* Vehicles tables */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-3.5 px-5">Patente PPU</th>
                <th className="py-3.5 px-4">Unidad</th>
                <th className="py-3.5 px-4">Proveedor Leasing</th>
                <th className="py-3.5 px-4 text-right">Odómetro Actual</th>
                <th className="py-3.5 px-4 text-center">Estado de Reporte</th>
                <th className="py-3.5 px-4 text-right">Gastado Combustible</th>
                <th className="py-3.5 px-5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                    No se encontraron vehículos asignados al contrato "{selectedContract}" con los criterios provistos.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(veh => {
                  const status = getVehicleUpdateStatus(veh.ppu);
                  const isExpanded = expandedVehicle === veh.ppu;

                  // Fuel loads logged for this specific vehicle in this contract
                  const vehicleLogs = logs.filter(l => l.ppu === veh.ppu);
                  const vehicleSpent = vehicleLogs.reduce((sum, l) => sum + (l.combustible?.monto_total || 0), 0);
                  
                  // Diagnostic next service alert
                  const remainingToNextService = 10000 - (veh.kilometraje % 10000);
                  const nearService = remainingToNextService <= 1000;
                  const nextServiceKm = Math.ceil(veh.kilometraje / 10000) * 10000;

                  return (
                    <React.Fragment key={veh.ppu}>
                      <tr className="hover:bg-slate-50/50 transition-all">
                        <td className="py-4 px-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono bg-slate-100 text-slate-900 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-extrabold block w-fit">
                              {veh.ppu}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono font-bold block mt-1">COD: {veh.codigo_unico}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-left">
                          <div className="text-xs font-bold text-slate-900">{veh.marca} {veh.modelo}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{veh.tipo} ({veh.anio})</div>
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {veh.proveedor}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                          {veh.kilometraje.toLocaleString()} km
                          {nearService && (
                            <span className="block text-[9px] text-amber-650 font-sans tracking-tight font-medium mt-0.5" title={`Próximo mantenimiento sugerido a los ${nextServiceKm.toLocaleString()} km`}>
                              ⚠️ Mantención en {remainingToNextService.toLocaleString()} km
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.8 rounded-full text-[10px] font-extrabold ${
                              status.code === 'green'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : status.code === 'yellow'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {status.text}
                            </span>
                            {status.date && (
                              <span className="text-[9px] text-slate-400 block mt-1">Registrado {status.date}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-slate-800">
                          ${vehicleSpent.toLocaleString()} CLP
                          <div className="text-[9px] text-slate-400 font-sans font-normal mt-0.5">
                            {vehicleLogs.filter(l => l.combustible).length} cargas registradas
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedVehicle(null);
                              } else {
                                setExpandedVehicle(veh.ppu);
                                setNewOdometer(String(veh.kilometraje));
                                setHasFuel(false);
                              }
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold p-1.5 rounded-lg text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                            id={`btn-expand-vehicle-${veh.ppu}`}
                          >
                            <span>Ficha Reporte</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Update Form Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-slate-50/60 p-6 text-left border-y border-slate-150">
                            <div className="max-w-3xl mx-auto space-y-6" id={`drawer-form-${veh.ppu}`}>
                              
                              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                                  Reguladora de Información Semanal: {veh.ppu}
                                </h4>
                                <span className="text-slate-400 text-[10px] uppercase font-bold">CONTRATO: {selectedContract} • CC {veh.centro_costo}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Section A: Mileage update */}
                                <div className="space-y-4">
                                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
                                    <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wide block">1. Registro de Kilometraje (Odómetro)</h5>
                                    <div>
                                      <label className="text-[10px] text-slate-450 uppercase font-bold block mb-1">Odómetro Actual del Vehículo</label>
                                      <div className="font-mono text-xs font-bold text-slate-500 bg-slate-100 p-2 rounded-lg border border-slate-200">
                                        {veh.kilometraje.toLocaleString()} km
                                      </div>
                                    </div>

                                    <div>
                                      <label htmlFor={`odometer-input-${veh.ppu}`} className="text-[10px] text-slate-700 uppercase font-bold block mb-1">Nuevo Kilometraje Declarado*</label>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          id={`odometer-input-${veh.ppu}`}
                                          value={newOdometer}
                                          onChange={(e) => setNewOdometer(e.target.value)}
                                          className="w-full text-xs font-mono font-bold p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                          placeholder="Ej: 120650"
                                          min={veh.kilometraje}
                                        />
                                        <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold uppercase">KM</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                    <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wide block">3. Observaciones del Estado</h5>
                                    <div>
                                      <textarea
                                        rows={2}
                                        value={generalObservations}
                                        onChange={(e) => setGeneralObservations(e.target.value)}
                                        className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-950 focus:outline-none"
                                        placeholder="Bitácora de fallas leves, observaciones mecánicas o comentarios generales de la unidad..."
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Section B: Fuel loading */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <h5 className="font-bold text-xs text-slate-850 uppercase tracking-wide flex items-center gap-1.5">
                                      <Fuel className="w-4 h-4 text-indigo-600" />
                                      2. Declarar Carga Combustible
                                    </h5>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="checkbox"
                                        id={`has-fuel-check-${veh.ppu}`}
                                        checked={hasFuel}
                                        onChange={(e) => setHasFuel(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 border-slate-200 rounded focus:ring-indigo-500"
                                      />
                                      <label htmlFor={`has-fuel-check-${veh.ppu}`} className="text-xs font-bold text-indigo-700 cursor-pointer">Sí, cargar boleta</label>
                                    </div>
                                  </div>

                                  {hasFuel ? (
                                    <div className="space-y-3 pt-1 animate-fade-in">
                                      
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-slate-700 uppercase font-bold block mb-1">Proveedor Autorizado*</label>
                                          <select
                                            value={fuelProvider}
                                            onChange={(e) => setFuelProvider(e.target.value as 'Copec' | 'Shell')}
                                            className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 font-bold focus:outline-none focus:border-slate-400"
                                          >
                                            <option value="Copec">COPEC</option>
                                            <option value="Shell">SHELL</option>
                                          </select>
                                        </div>

                                        <div>
                                          <label className="text-[10px] text-slate-750 uppercase font-bold block mb-1">Monto Total CLP*</label>
                                          <div className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-150 text-right">
                                            $ {computedFuelTotal.toLocaleString()} CLP
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-slate-700 uppercase font-bold block mb-1">Cantidad de Litros*</label>
                                          <input
                                            type="number"
                                            step="any"
                                            value={fuelLitres}
                                            onChange={(e) => setFuelLitres(e.target.value)}
                                            className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-450"
                                            placeholder="Litros (ej: 45.3)"
                                          />
                                        </div>

                                        <div>
                                          <label className="text-[10px] text-slate-700 uppercase font-bold block mb-1">Precio por Litro*</label>
                                          <div className="relative">
                                            <input
                                              type="number"
                                              value={fuelPricePerLitre}
                                              onChange={(e) => setFuelPricePerLitre(e.target.value)}
                                              className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-450"
                                              placeholder="Precio (CLP/Lt)"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-slate-450 uppercase font-extrabold block mb-1">Fecha Carga</label>
                                          <input
                                            type="date"
                                            value={fuelDate}
                                            onChange={(e) => setFuelDate(e.target.value)}
                                            className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none"
                                          />
                                        </div>

                                        <div>
                                          <label className="text-[10px] text-slate-450 uppercase font-extrabold block mb-1">Hora Carga</label>
                                          <input
                                            type="time"
                                            value={fuelTime}
                                            onChange={(e) => setFuelTime(e.target.value)}
                                            className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-slate-450 uppercase font-bold block mb-1">Comentarios Combustible</label>
                                        <input
                                          type="text"
                                          value={fuelObservations}
                                          onChange={(e) => setFuelObservations(e.target.value)}
                                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none"
                                          placeholder="N° boleta, odómetro o detalles adicionales del cargador"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-44 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                      <Fuel className="w-8 h-8 text-slate-350 stroke-1.25 mb-1.5" />
                                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sin boleta de Combustible</p>
                                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs">Habilite la casilla de verificación superior si el conductor cargó combustible Shell/Copec esta semana.</p>
                                    </div>
                                  )}
                                </div>

                              </div>

                              {/* Form submit footer controls */}
                              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => setExpandedVehicle(null)}
                                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveReport(veh.ppu)}
                                  className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <Check className="w-4 h-4" />
                                  Guardar Reporte Semanal
                                </button>
                              </div>

                              {/* History of logged updates for this PATENT (PPU) */}
                              {vehicleLogs.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-slate-250">
                                  <h6 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-450 block mb-2.5">Historial Reciente de Reportes (Patente {veh.ppu})</h6>
                                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left text-[11px] border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-extrabold text-slate-400 uppercase tracking-tight">
                                          <th className="py-2.5 px-3">Fecha Declaración</th>
                                          <th className="py-2.5 px-3">Odómetro</th>
                                          <th className="py-2.5 px-3">Proveedor</th>
                                          <th className="py-2.5 px-3 text-right">Volumen</th>
                                          <th className="py-2.5 px-3 text-right">Valor Total</th>
                                          <th className="py-2.5 px-3">Comentarios</th>
                                          <th className="py-2.5 px-3">Registrado por</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-medium">
                                        {vehicleLogs.map(log => (
                                          <tr key={log.id} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{log.fecha_actualizacion}</td>
                                            <td className="py-2 px-3 font-mono font-bold text-slate-800">{log.odometro.toLocaleString()} km</td>
                                            <td className="py-2 px-3">
                                              {log.combustible ? (
                                                <span className={`font-bold uppercase text-[9px] ${log.combustible.proveedor === 'Copec' ? 'text-orange-600' : 'text-blue-600'}`}>
                                                  {log.combustible.proveedor}
                                                </span>
                                              ) : (
                                                <span className="text-slate-400 font-normal italic">N/A</span>
                                              )}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                                              {log.combustible ? `${log.combustible.litros.toLocaleString()} L` : '—'}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                              {log.combustible ? `$${log.combustible.monto_total.toLocaleString()}` : '—'}
                                            </td>
                                            <td className="py-2 px-3 text-slate-500 font-sans italic truncate max-w-[150px]" title={log.observaciones || log.combustible?.observaciones || 'Sin observaciones'}>
                                              {log.observaciones || log.combustible?.observaciones || 'Sin observaciones'}
                                            </td>
                                            <td className="py-2 px-3 text-slate-400 font-bold">{log.supervisor_nombre}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}

                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Contract Fuel Transactions Table Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm text-left">
        <div className="p-5 border-b border-slate-100">
          <h4 className="font-extrabold text-xs uppercase text-slate-900 tracking-wider">Bitácora General de Combustible ({selectedContract})</h4>
          <p className="text-xs text-slate-500 mt-1">Suministros COPEC y SHELL declarados por supervisores de terreno esta temporada.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-medium">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-100">
                <th className="py-3 px-5">Código Reporte</th>
                <th className="py-3 px-4">Patente PPU</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Suministrador</th>
                <th className="py-3 px-4 text-right">Volumen Litros</th>
                <th className="py-3 px-4 text-right">Precio/LT</th>
                <th className="py-3 px-4 text-right">Monto Total CLP</th>
                <th className="py-3 px-5">Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contractLogs.filter(l => l.combustible).length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-440 italic">
                    No se han registrado transacciones de combustible para el contrato "{selectedContract}".
                  </td>
                </tr>
              ) : (
                contractLogs.filter(l => l.combustible).map(log => {
                  const fuel = log.combustible!;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/40">
                      <td className="py-3.5 px-5 font-mono text-[10px] font-semibold text-slate-500">{log.id}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-950">{log.ppu}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{log.fecha_actualizacion}</td>
                      <td className="py-3.5 px-4">
                        <span className={`font-extrabold uppercase text-[10px] px-2 py-0.5 rounded ${
                          fuel.proveedor === 'Copec' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {fuel.proveedor}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">{fuel.litros.toLocaleString()} L</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">${fuel.valor_combustible.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">${fuel.monto_total.toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-slate-450 font-bold">{log.supervisor_nombre}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
