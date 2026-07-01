import React, { useState } from 'react';
import { FleetMovementLog, Vehicle, CONTRATO_CENTRO_COSTO, UserPermissions } from '../types';
import { RefreshCw, ArrowRightLeft, LogIn, LogOut, Search, Plus, Calendar, User, FileSpreadsheet, FileDown } from 'lucide-react';
import { exportMovementsToExcel, triggerMovementsPDFPrint } from '../utils/exporters';

interface MovementsTabProps {
  movements: FleetMovementLog[];
  vehicles: Vehicle[];
  onUpdateMovements: (newMoves: FleetMovementLog[]) => void;
  onUpdateVehicles: (updatedVehicles: Vehicle[]) => void;
  permissions: UserPermissions;
  currentSimulatedAdminUser: string;
}

export default function MovementsTab({
  movements,
  vehicles,
  onUpdateMovements,
  onUpdateVehicles,
  permissions,
  currentSimulatedAdminUser
}: MovementsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [plate, setPlate] = useState('');
  const [movementType, setMovementType] = useState<'Entrada' | 'Salida' | 'Cambio de Contrato'>('Cambio de Contrato');
  const [targetContract, setTargetContract] = useState('AVO');
  const [comments, setComments] = useState('');

  const handleLogMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.movimientos_flota) {
      alert('Nivel de permisos insuficiente para registrar movimientos de flota.');
      return;
    }

    if (!plate || !comments) {
      alert('Por favor llene todos los campos requeridos.');
      return;
    }

    const veh = vehicles.find(v => v.ppu === plate.toUpperCase().trim());
    if (!veh) {
      alert(`La patente ${plate} no existe en el sistema.`);
      return;
    }

    const originalContract = veh.contrato;
    const destContract = movementType === 'Salida' ? 'Fuera de Operación' : targetContract;

    // Create the log
    const nextMove: FleetMovementLog = {
      id: `MOV-${Math.floor(Math.random() * 9000 + 1000)}`,
      codigo_vehiculo: veh.codigo_unico,
      ppu: veh.ppu,
      fecha: new Date().toISOString().slice(0, 10),
      tipo_movimiento: movementType,
      contrato_origen: movementType === 'Entrada' ? 'No asignado' : originalContract,
      contrato_destino: destContract,
      comentario: comments,
      operador: currentSimulatedAdminUser || 'Administrador Central'
    };

    // Update the actual vehicle contract field & cost center dynamically in real-time!
    const targetCC = CONTRATO_CENTRO_COSTO[destContract] || 100;
    const updatedVehicles = vehicles.map(v => {
      if (v.ppu === veh.ppu) {
        return {
          ...v,
          contrato: destContract,
          centro_costo: targetCC,
          // If we logged a "Salida", maybe mark vehicle as Inactive
          estado: movementType === 'Salida' ? 'Inactivo' as const : v.estado
        };
      }
      return v;
    });

    onUpdateVehicles(updatedVehicles);
    onUpdateMovements([nextMove, ...movements]);
    setIsAdding(false);

    // Reset Form
    setPlate('');
    setMovementType('Cambio de Contrato');
    setTargetContract('AVO');
    setComments('');
  };

  const filteredMovements = movements.filter(m => {
    return (
      m.ppu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.codigo_vehiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.contrato_destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.comentario.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6" id="movements-tab-view">
      
      {/* Overview information block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="font-bold text-slate-900 text-sm">Bitácora Oficial de Traspasos y Asignación de Contratos</h3>
          <p className="text-xs text-slate-500 mt-1">
            Cada registro actúa como un libro de actas digital para auditar la trazabilidad operacional de los móviles chilenos.
          </p>
        </div>

        {permissions.movimientos_flota && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs py-2 px-4 inline-flex items-center gap-1.5 transition-all shadow-md shadow-indigo-100 shrink-0"
            id="btn-add-movement-trigger"
          >
            <Plus className="w-4 h-4" />
            {isAdding ? 'Cerrar Registro' : 'Registrar Traslado/Entrada/Salida'}
          </button>
        )}
      </div>

      {/* Manual Input Addition form */}
      {isAdding && (
        <form onSubmit={handleLogMovement} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-left max-w-xl mx-auto block space-y-4 font-sans" id="movement-logging-form">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Registrar Movimiento de Flota
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Móvil a Mover (PPU)*</label>
              <select
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                required
              >
                <option value="">Seleccione...</option>
                {vehicles.map(v => (
                  <option key={v.ppu} value={v.ppu}>
                    {v.codigo_unico} ({v.ppu}) - Contrato Actual: {v.contrato}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Movimiento*</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as any)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
              >
                <option value="Cambio de Contrato">Cambio de Contrato (Traspaso Inter-Contratos)</option>
                <option value="Entrada">Entrada (Alta de Vehículo)</option>
                <option value="Salida">Salida (Baja/Fuera de Operación)</option>
              </select>
            </div>

            {movementType !== 'Salida' && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Contrato de Destino (Auto-asigna CC)*</label>
                <select
                  value={targetContract}
                  onChange={(e) => setTargetContract(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-semibold text-indigo-700"
                >
                  {Object.keys(CONTRATO_CENTRO_COSTO).map(k => (
                    <option key={k} value={k}>
                      {k} (Centro de Costo: {CONTRATO_CENTRO_COSTO[k]})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Comentario Justificativo / Contrato Asociado*</label>
            <textarea
              required
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg h-24 focus:ring-1 focus:ring-indigo-500"
              placeholder="Ej. Se reasigna grúa liviana al contrato Puente Industrial debido al aumento del flujo vial estacional..."
            />
          </div>

          <p className="text-[10px] text-slate-400 italic">
            * El sistema actualizará de manera automatizada la ficha técnica del móvil, incluyendo su Centro de Costo (CC).
          </p>

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
              className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
            >
              Registrar Movilidad
            </button>
          </div>
        </form>
      )}

      {/* Toolbar Search filter & Export option buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="max-w-xs w-full text-left">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar bitácoras de traspaso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden"
              id="movements-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportMovementsToExcel(filteredMovements)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            title="Exportar bitácora filtrada a Excel (CSV)"
            id="btn-export-movements-excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Descargar Excel</span>
          </button>
          <button
            onClick={() => triggerMovementsPDFPrint(filteredMovements)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            title="Exportar bitácora filtrada a PDF / Imprimir"
            id="btn-export-movements-pdf"
          >
            <FileDown className="w-4 h-4 text-rose-600" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Ledger history Timeline/Table view */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto text-left">
          <table className="w-full text-xs table-auto">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Código Folio</th>
                <th className="py-3 px-4">Unidad PPU</th>
                <th className="py-3 px-4 text-center">Tipo Registro</th>
                <th className="py-3 px-4 text-center">Fecha de cambio</th>
                <th className="py-3 px-4">Contrato Origen</th>
                <th className="py-3 px-4">Contrato Destino</th>
                <th className="py-3 px-4">Operador Responsable</th>
                <th className="py-3 px-4">Detalle / Justificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" id="movements-tbody">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No se registran bitácoras de movimientos de contrato de flota.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors font-medium text-slate-700">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono bg-slate-100 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-slate-250">
                        {m.ppu}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.tipo_movimiento === 'Entrada' ? 'bg-emerald-50 text-emerald-700' :
                        m.tipo_movimiento === 'Salida' ? 'bg-rose-50 text-rose-700' :
                        'bg-indigo-50 text-indigo-700'
                      }`}>
                        {m.tipo_movimiento === 'Entrada' ? <LogIn className="w-2.5 h-2.5" /> : m.tipo_movimiento === 'Salida' ? <LogOut className="w-2.5 h-2.5" /> : <ArrowRightLeft className="w-2.5 h-2.5" />}
                        {m.tipo_movimiento}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500 whitespace-nowrap">{m.fecha}</td>
                    <td className="py-3 px-4 text-slate-500 italic">{m.contrato_origen || 'Por definir'}</td>
                    <td className="py-3 px-4 text-indigo-700 font-bold">{m.contrato_destino}</td>
                    <td className="py-3 px-4 text-slate-700 font-sans flex items-center gap-1.5 mt-2.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {m.operador}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-sm font-sans whitespace-pre-wrap">{m.comentario}</td>
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
