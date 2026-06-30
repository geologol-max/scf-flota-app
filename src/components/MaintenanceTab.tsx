import React, { useState } from 'react';
import { MaintenanceLog, Vehicle, UserPermissions } from '../types';
import { Wrench, Calendar, Plus, Coins, Search, FileText, ClipboardList, Printer } from 'lucide-react';
import { exportMaintenanceOrderToPDF } from '../utils/exporters';

interface MaintenanceTabProps {
  logs: MaintenanceLog[];
  vehicles: Vehicle[];
  onUpdateLogs: (newLogs: MaintenanceLog[]) => void;
  permissions: UserPermissions;
}

export default function MaintenanceTab({ logs, vehicles, onUpdateLogs, permissions }: MaintenanceTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [plate, setPlate] = useState('');
  const [serviceType, setServiceType] = useState('Mantención Preventiva 10.000 KM');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [odometer, setOdometer] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [workshop, setWorkshop] = useState('');
  const [responsible, setResponsible] = useState('');

  const selectedVehicle = vehicles.find(v => v.ppu === plate);
  const currentContract = selectedVehicle ? selectedVehicle.contrato : '';
  const currentCostCenter = selectedVehicle ? `CC ${selectedVehicle.centro_costo}` : '';

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.editar_flota) {
      alert('Nivel de permisos insuficiente para añadir registros a la bitácora.');
      return;
    }

    if (!plate || !description || !workshop) {
      alert('Por favor complete los campos marcados como requeridos.');
      return;
    }

    // Lookup vehicle by plate
    const veh = vehicles.find(v => v.ppu === plate.toUpperCase().trim());
    if (!veh) {
      alert(`La patente ${plate} no existe en el registro central de flota.`);
      return;
    }

    const nextLog: MaintenanceLog = {
      id: `MNT-${Math.floor(Math.random() * 9000 + 1000)}`,
      codigo_vehiculo: veh.codigo_unico,
      ppu: veh.ppu,
      fecha: date,
      tipo_servicio: serviceType,
      kilometraje: Number(odometer) || veh.kilometraje,
      costo: Number(cost),
      descripcion: description,
      taller: workshop,
      contrato: veh.contrato,
      centro_costo: veh.centro_costo,
      responsable: responsible.trim() || 'Administrador de Flota'
    };

    onUpdateLogs([nextLog, ...logs]);
    setIsAdding(false);

    // Reset form
    setPlate('');
    setServiceType('Mantención Preventiva 10.000 KM');
    setDate(new Date().toISOString().slice(0, 10));
    setOdometer(0);
    setCost(0);
    setDescription('');
    setWorkshop('');
    setResponsible('');
  };

  const filteredLogs = logs.filter(l => {
    return (
      l.ppu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.codigo_vehiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.tipo_servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.taller.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalCost = filteredLogs.reduce((sum, item) => sum + item.costo, 0);

  return (
    <div className="space-y-6" id="maintenance-tab-view">
      
      {/* Top action cards & summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="maintenance-summary-cards">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 text-left flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Desembolso Total Filtrado</div>
            <div className="text-2xl font-bold font-mono text-slate-900">${totalCost.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 text-left flex items-center gap-4">
          <div className="p-3.5 bg-cyan-50 text-cyan-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold font-sans">Órdenes Ejecutadas</div>
            <div className="text-2xl font-bold font-mono text-slate-900">{filteredLogs.length} registros</div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 text-left flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-indigo-400" />
            <div>
              <h4 className="font-bold text-xs">Bitácora Digital</h4>
              <p className="text-[10px] text-slate-400">Servicios preventivos y correctivos</p>
            </div>
          </div>
          {permissions.editar_flota && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-2 rounded-lg font-bold transition-all"
              id="btn-add-maintenance-log"
            >
              Loggear Mantención
            </button>
          )}
        </div>
      </div>

      {/* Manual Input Addition form */}
      {isAdding && permissions.editar_flota && (
        <form onSubmit={handleAddLog} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left max-w-xl mx-auto block space-y-4" id="maintenance-log-form">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Ingresar Reporte de Servicio de Mantenimiento
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Patente del Vehículo (PPU)*</label>
              <select
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                required
              >
                <option value="">Seleccione Vehículo...</option>
                {vehicles.map(v => (
                  <option key={v.ppu} value={v.ppu}>
                    {v.codigo_unico} - {v.ppu} ({v.marca} {v.modelo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Servicio*</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Mantención Preventiva 10.000 KM">Mantención Preventiva 10.000 KM</option>
                <option value="Mantención Preventiva 20.000 KM">Mantención Preventiva 20.000 KM</option>
                <option value="Mantención Preventiva 50.000 KM">Mantención Preventiva 50.000 KM</option>
                <option value="Servicio de Frenos Correctivo">Servicio de Frenos Correctivo</option>
                <option value="Reparación Eléctrico / Alternador">Reparación Eléctrico / Alternador</option>
                <option value="Reparación Neumáticos / Alineación">Reparación Neumáticos / Alineación</option>
                <option value="Reparación Estructural / Carrocería">Reparación Estructural / Carrocería</option>
                <option value="Otro Servicio Mecánico">Otro Servicio Mecánico</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha de Ejecución*</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Costo Neto Servicio (CLP)*</label>
              <input
                type="number"
                required
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono"
                placeholder="Ej. 180000"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Kilometraje al Realizar*</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(Number(e.target.value))}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono"
                placeholder="Opcional. Ej. 25000"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Taller Ejecutor*</label>
              <input
                type="text"
                required
                value={workshop}
                onChange={(e) => setWorkshop(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                placeholder="Ej. SALFA Recoleta"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Contrato (Válido PPU)</label>
              <input
                type="text"
                readOnly
                value={currentContract || 'Se autocompleta con PPU'}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Centro de Costo (Válido PPU)</label>
              <input
                type="text"
                readOnly
                value={currentCostCenter || 'Se autocompleta con PPU'}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Responsable Autoriza / Emite*</label>
              <input
                type="text"
                required
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                placeholder="Ej. Eduardo Garrido (Jefe Logística)"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Detalle y Repuestos Reemplazados*</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg h-20 focus:ring-1 focus:ring-indigo-500"
              placeholder="Describa el trabajo realizado de forma pormenorizada..."
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
              className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
            >
              Loggear
            </button>
          </div>
        </form>
      )}

      {/* Local search toolbar */}
      <div className="max-w-xs text-left">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por patente, taller, servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden"
            id="maintenance-search"
          />
        </div>
      </div>

      {/* Table grid of services logs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto text-left">
          <table className="w-full text-xs table-auto">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-widest text-[10px]">
              <tr>
                <th className="py-3.5 px-4">ID Orden</th>
                <th className="py-3.5 px-4">Vehículo PPU</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Tipo Servicio</th>
                <th className="py-3.5 px-4 text-right">Odómetro</th>
                <th className="py-3.5 px-4 text-right">Costo Neto</th>
                <th className="py-3.5 px-4">Taller Autorizado</th>
                <th className="py-3.5 px-4">Descripción y Responsable</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-450 italic">
                    Sin mantenciones registradas con los filtros indicados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-all font-medium text-slate-700">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono bg-slate-100 text-slate-900 font-bold px-1.5 py-0.2 rounded border text-[10px]">
                            {log.ppu}
                          </span>
                          <span className="text-[10px] text-slate-400">({log.codigo_vehiculo})</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono tracking-tight">
                          {log.contrato || 'N/A'} • CC {log.centro_costo !== undefined ? log.centro_costo : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {log.fecha}
                    </td>
                    <td className="py-3 px-4 text-indigo-700 font-semibold">{log.tipo_servicio}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900">
                      {log.kilometraje.toLocaleString()} km
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                      ${log.costo.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans italic">{log.taller}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-sm">
                      <div className="line-clamp-2 hover:line-clamp-none transition-all pr-4">{log.descripcion}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-sans">
                        Autorizado por: <strong className="text-slate-600 font-medium">{log.responsable || 'Administrador'}</strong>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          const matchVehicle = vehicles.find(v => v.ppu === log.ppu);
                          exportMaintenanceOrderToPDF(log, matchVehicle);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-indigo-100 shadow-xs"
                        title="Imprimir Orden de Trabajo"
                        id={`btn-print-ot-${log.id}`}
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Imprimir OT</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
