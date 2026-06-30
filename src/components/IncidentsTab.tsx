import React, { useState } from 'react';
import { Incident, Vehicle, UserPermissions } from '../types';
import { AlertCircle, Plus, Search, Hammer, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

interface IncidentsTabProps {
  incidents: Incident[];
  vehicles: Vehicle[];
  onUpdateIncidents: (newIncidents: Incident[]) => void;
  onUpdateVehicles: (updatedVehicles: Vehicle[]) => void;
  permissions: UserPermissions;
}

export default function IncidentsTab({
  incidents,
  vehicles,
  onUpdateIncidents,
  onUpdateVehicles,
  permissions
}: IncidentsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [plate, setPlate] = useState('');
  const [incidentType, setIncidentType] = useState<'Colisión' | 'Choque' | 'Falla Mecánica' | 'Robo/Hurto' | 'Siniestro Vial' | 'Otro'>('Siniestro Vial');
  const [description, setDescription] = useState('');
  const [gravity, setGravity] = useState<'Leve' | 'Moderada' | 'Grave'>('Moderada');
  const [cost, setCost] = useState<number>(0);
  const [insuranceComments, setInsuranceComments] = useState('');

  const handleRegisterIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.incidentes_siniestros) {
      alert('Nivel de acceso insuficiente para registrar reportes de incidentes viales.');
      return;
    }

    if (!plate || !description) {
      alert('Por favor complete todos los campos obligatorios del siniestro.');
      return;
    }

    const veh = vehicles.find(v => v.ppu === plate.toUpperCase().trim());
    if (!veh) {
      alert(`La patente ${plate} de vehículo no existe en el sistema.`);
      return;
    }

    // Create log
    const nextInc: Incident = {
      id: `INC-${Math.floor(Math.random() * 9000 + 1000)}`,
      codigo_vehiculo: veh.codigo_unico,
      ppu: veh.ppu,
      fecha: new Date().toISOString().slice(0, 10),
      tipo_incidente: incidentType,
      descripcion: description,
      gravedad: gravity,
      costo_estimado: Number(cost) || 0,
      estado_resolucion: 'Pendiente',
      comentario_seguro: insuranceComments
    };

    // Auto-update vehicle operational state to 'Siniestrado' if incident is Grave or Moderada
    const nextVehicles = vehicles.map(v => {
      if (v.ppu === veh.ppu) {
        return {
          ...v,
          estado: (gravity === 'Grave' || gravity === 'Moderada') ? ('Siniestrado' as const) : v.estado
        };
      }
      return v;
    });

    onUpdateVehicles(nextVehicles);
    onUpdateIncidents([nextInc, ...incidents]);
    setIsAdding(false);

    // Reset Form
    setPlate('');
    setDescription('');
    setCost(0);
    setInsuranceComments('');
  };

  const handleResolveSiniestro = (incId: string, resolvedStatus: 'En Proceso' | 'Resuelto', repaired: boolean) => {
    if (!permissions.editar_flota) {
      alert('Se requieren permisos de administrador de flota para actualizar la resolución del seguro.');
      return;
    }

    const nextIncidents = incidents.map(inc => {
      if (inc.id === incId) {
        return {
          ...inc,
          estado_resolucion: resolvedStatus
        };
      }
      return inc;
    });

    const targetPlate = incidents.find(inc => inc.id === incId)?.ppu;

    // If completely resolved, restore vehicle state to "Operativo"
    const nextVehicles = vehicles.map(v => {
      if (v.ppu === targetPlate && resolvedStatus === 'Resuelto' && repaired) {
        return { ...v, estado: 'Operativo' as const };
      }
      return v;
    });

    onUpdateVehicles(nextVehicles);
    onUpdateIncidents(nextIncidents);
  };

  const filteredIncidents = incidents.filter(i => {
    return (
      i.ppu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.codigo_vehiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.tipo_incidente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6" id="incidents-tab-view">
      
      {/* Quick summary heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="font-semibold text-slate-900 text-sm tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Consola Reguladora de Incidentes, Accidentes y Siniestros
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Garantice la trazabilidad de denuncios de seguros logísticos, liquidaciones de siniestros, y re-activación de móviles.
          </p>
        </div>

        {permissions.incidentes_siniestros && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs py-2 px-4 inline-flex items-center gap-1.5 transition-all shadow-md shrink-0"
            id="btn-trigger-add-incident"
          >
            <Plus className="w-4 h-4 text-rose-400" />
            {isAdding ? 'Cerrar Registro' : 'Declarar Nuevo Siniestro Vial'}
          </button>
        )}
      </div>

      {/* Manual Input Addition form */}
      {isAdding && (
        <form onSubmit={handleRegisterIncident} className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm text-left max-w-xl mx-auto block space-y-4" id="incident-declaration-form">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Declaración Oficial de Siniestro / Accidente Vial
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Móvil Involucrado (PPU)*</label>
              <select
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                required
              >
                <option value="">Seleccione...</option>
                {vehicles.map(v => (
                  <option key={v.ppu} value={v.ppu}>
                    {v.codigo_unico} ({v.ppu}) - {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Incidente*</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Siniestro Vial">Siniestro Vial (Colisión Mayor)</option>
                <option value="Colisión">Colisión (Choque con terceros)</option>
                <option value="Choque">Choque menor contra Obra Fija</option>
                <option value="Falla Mecánica">Falla Mecánica de Consideración</option>
                <option value="Robo/Hurto">Robo o Hurto de Accesorios</option>
                <option value="Otro">Otro Incidente Operativo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Gravedad Operacional*</label>
              <select
                value={gravity}
                onChange={(e) => setGravity(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-bold"
              >
                <option value="Leve">Leve (Móvil continúa operativo)</option>
                <option value="Moderada">Moderada (Daños estéticos / Retiro preventivo)</option>
                <option value="Grave">Grave (Móvil inhabilitado, requiere taller pesado)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Costo Estimado de Daños (CLP)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono"
                placeholder="Ej. 650000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Relato Detallado de los Hechos (Lugar, Chofer)*</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg h-24 focus:ring-1 focus:ring-indigo-500"
              placeholder="Describa fecha, hora, autopista o concesión y chofer a cargo al momento del siniestro vial..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Estatus del Seguro / Compañía Liquidadora</label>
            <input
              type="text"
              value={insuranceComments}
              onChange={(e) => setInsuranceComments(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg"
              placeholder="Ej. Denuncio BCI N° 3445122 - Conductor asiste a Carabineros para constancia..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md"
            >
              Registrar Declaración
            </button>
          </div>
        </form>
      )}

      {/* Filter toolbar */}
      <div className="max-w-xs text-left">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar siniestros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden"
            id="incidents-search"
          />
        </div>
      </div>

      {/* Grid listing of accidents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left" id="incidents-grid-list">
        {filteredIncidents.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400 font-medium">
            No se encuentran siniestros activos registrados en la bitácora logística.
          </div>
        ) : (
          filteredIncidents.map(inc => (
            <div key={inc.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {inc.ppu}
                    </span>
                    <strong className="text-xs text-slate-800 font-mono">{inc.id}</strong>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    inc.gravedad === 'Grave' ? 'bg-rose-100 text-rose-800' : inc.gravedad === 'Moderada' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    ⚠️ Gravedad {inc.gravedad}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-tight">
                  {inc.tipo_incidente} • {inc.codigo_vehiculo}
                </h4>
                <div className="text-[10px] text-slate-400 font-mono mt-1">Siniestro declarado: {inc.fecha}</div>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {inc.descripcion}
                </p>

                {inc.comentario_seguro && (
                  <div className="mt-3 text-[11px] text-slate-500">
                    <strong>Liquidación Seguro:</strong> {inc.comentario_seguro}
                  </div>
                )}

                {inc.costo_estimado > 0 && (
                  <div className="mt-2 text-xs font-mono font-semibold text-slate-750">
                    Presupuesto Daños Reparación: <span className="text-rose-600 font-bold">${inc.costo_estimado.toLocaleString()} CLP</span>
                  </div>
                )}
              </div>

              {/* Action Buttons to update repair state */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Estado de Liquidación</span>
                  <span className={`inline-block text-[10px] font-bold ${
                    inc.estado_resolucion === 'Pendiente' ? 'text-rose-600' : inc.estado_resolucion === 'En Proceso' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    ● {inc.estado_resolucion}
                  </span>
                </div>

                {permissions.editar_flota && inc.estado_resolucion !== 'Resuelto' && (
                  <div className="flex gap-2">
                    {inc.estado_resolucion === 'Pendiente' && (
                      <button
                        onClick={() => handleResolveSiniestro(inc.id, 'En Proceso', false)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-amber-200 transition-all"
                      >
                        Pasar a Curso
                      </button>
                    )}
                    <button
                      onClick={() => handleResolveSiniestro(inc.id, 'Resuelto', true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all flex items-center gap-1"
                      title="Reparar Vehículo y Retornarlo al Estado Operativo"
                    >
                      <Hammer className="w-3 h-3" />
                      Resolver y Operar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
