import React, { useState } from 'react';
import { Vehicle, UserRole, WorkshopLog, WorkshopChecklist } from '../types';
import { Wrench, ClipboardCheck, Calendar, User, Search, Plus, Check, FileText, Printer, ArrowRightLeft } from 'lucide-react';

interface WorkshopTabProps {
  mode: 'recepcion' | 'salida';
  vehicles: Vehicle[];
  onUpdateVehicles: (updated: Vehicle[]) => void;
  logs: WorkshopLog[];
  onAddWorkshopLog: (log: Omit<WorkshopLog, 'id'>) => Promise<void>;
  currentUser: UserRole;
}

export default function WorkshopTab({
  mode,
  vehicles,
  onUpdateVehicles,
  logs,
  onAddWorkshopLog,
  currentUser
}: WorkshopTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [plate, setPlate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [odometer, setOdometer] = useState<string>('');
  const [responsible, setResponsible] = useState(currentUser.nombre);
  const [comments, setComments] = useState('');

  // Checklist states
  const [luces, setLuces] = useState(true);
  const [neumaticos, setNeumaticos] = useState(true);
  const [carroceria, setCarroceria] = useState(true);
  const [herramientas, setHerramientas] = useState(true);
  const [documentos, setDocumentos] = useState(true);

  // Quality checks for exit only
  const [limpieza, setLimpieza] = useState(true);
  const [fluidos, setFluidos] = useState(true);
  const [pruebaRuta, setPruebaRuta] = useState(true);

  // Sync odometer when vehicle selection changes
  const handlePlateChange = (ppu: string) => {
    setPlate(ppu);
    const v = vehicles.find(veh => veh.ppu === ppu);
    if (v) {
      setOdometer(String(v.kilometraje));
    } else {
      setOdometer('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plate || !odometer || !responsible) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    const veh = vehicles.find(v => v.ppu === plate);
    if (!veh) {
      alert('El vehículo seleccionado no existe en el sistema.');
      return;
    }

    const odometerNum = Number(odometer);
    if (isNaN(odometerNum) || odometerNum <= 0) {
      alert('Por favor ingrese un odómetro válido.');
      return;
    }

    if (mode === 'salida' && odometerNum < veh.kilometraje) {
      const confirmLower = window.confirm(`El kilometraje ingresado (${odometerNum.toLocaleString()} km) es menor que el registrado anteriormente (${veh.kilometraje.toLocaleString()} km). ¿Desea continuar?`);
      if (!confirmLower) return;
    }

    const checklist: WorkshopChecklist = {
      luces,
      neumaticos,
      carroceria,
      herramientas,
      documentos,
      ...(mode === 'salida' ? { limpieza, fluidos, prueba_ruta: pruebaRuta } : {})
    };

    const newLog: Omit<WorkshopLog, 'id'> = {
      tipo: mode === 'recepcion' ? 'Ingreso' : 'Salida',
      ppu: plate,
      codigo_vehiculo: veh.codigo_unico,
      fecha: `${date} ${time}`,
      odometro: odometerNum,
      responsable: responsible,
      checklist,
      observaciones: comments
    };

    // Save checklist log to Firestore
    await onAddWorkshopLog(newLog);

    // Update vehicle state:
    // Reception: state becomes Mantenimiento
    // Exit: state becomes Operativo, and odometer is updated to exit odometer
    const updatedVehicles = vehicles.map(v => {
      if (v.ppu === plate) {
        return {
          ...v,
          estado: mode === 'recepcion' ? ('Mantenimiento' as const) : ('Operativo' as const),
          kilometraje: odometerNum
        };
      }
      return v;
    });

    onUpdateVehicles(updatedVehicles);

    // Reset Form
    setPlate('');
    setOdometer('');
    setComments('');
    setLuces(true);
    setNeumaticos(true);
    setCarroceria(true);
    setHerramientas(true);
    setDocumentos(true);
    setLimpieza(true);
    setFluidos(true);
    setPruebaRuta(true);
    setIsAdding(false);

    alert(`Formulario de ${mode === 'recepcion' ? 'Recepción' : 'Salida'} guardado con éxito y estado de vehículo actualizado.`);
  };

  // Filter logs for this specific type and query
  const filteredLogs = logs
    .filter(l => l.tipo === (mode === 'recepcion' ? 'Ingreso' : 'Salida'))
    .filter(l => {
      const search = searchTerm.toLowerCase();
      return (
        l.ppu.toLowerCase().includes(search) ||
        l.codigo_vehiculo.toLowerCase().includes(search) ||
        l.responsable.toLowerCase().includes(search) ||
        l.observaciones.toLowerCase().includes(search)
      );
    });

  // Printing logic for individual workshop logs
  const handlePrintLog = (log: WorkshopLog) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor habilite los pop-ups para imprimir la ficha.');
      return;
    }

    const matchedVeh = vehicles.find(v => v.ppu === log.ppu);
    const vehDetails = matchedVeh ? `${matchedVeh.marca} ${matchedVeh.modelo} (${matchedVeh.anio}) - ${matchedVeh.tipo}` : 'No disponible';

    const checklistRows = [
      { label: 'Sistema de Luces y Señalizadores', val: log.checklist.luces },
      { label: 'Estado de Neumáticos y Presión', val: log.checklist.neumaticos },
      { label: 'Estado de Carrocería / Rayaduras / Golpes', val: log.checklist.carroceria },
      { label: 'Herramientas Obligatorias y Rueda de Repuesto', val: log.checklist.herramientas },
      { label: 'Documentación a Bordo (SOAP, RT, Permiso)', val: log.checklist.documentos },
      ...(log.tipo === 'Salida' ? [
        { label: 'Limpieza Interior y Exterior', val: log.checklist.limpieza },
        { label: 'Nivel de Fluidos (Aceite, refrigerante, frenos)', val: log.checklist.fluidos },
        { label: 'Prueba de Ruta y Funcionamiento General', val: log.checklist.prueba_ruta }
      ] : [])
    ].map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;">${item.label}</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: ${item.val ? '#166534' : '#991b1b'}; background-color: ${item.val ? '#dcfce7' : '#fee2e2'}">
          ${item.val ? 'CONFORME (PASA)' : 'NO CONFORME (FALLA)'}
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Acta de ${log.tipo === 'Ingreso' ? 'Recepción' : 'Salida'} de Taller - ${log.ppu}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 15px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title {
              font-size: 20px;
              font-weight: bold;
              color: #0f172a;
              text-transform: uppercase;
              margin: 0;
            }
            .badge-ot {
              background-color: #0f172a;
              color: white;
              padding: 6px 12px;
              font-size: 13px;
              font-weight: bold;
              border-radius: 4px;
              font-family: monospace;
            }
            .section-title {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              background-color: #f1f5f9;
              padding: 6px 10px;
              margin-top: 25px;
              margin-bottom: 12px;
              border-left: 4px solid #0f172a;
            }
            .grid-info {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              margin-bottom: 18px;
            }
            .info-item {
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
            }
            .info-label {
              font-size: 9px;
              font-weight: bold;
              color: #64748b;
              text-transform: uppercase;
            }
            .info-value {
              font-size: 12px;
              font-weight: 550;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-bottom: 30px;
            }
            th {
              background-color: #0f172a;
              color: white;
              font-weight: bold;
              text-align: left;
              padding: 10px;
            }
            .comments-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
              min-height: 60px;
              font-size: 12px;
            }
            .signature-section {
              margin-top: 60px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 40px;
            }
            .signature-box {
              text-align: center;
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
            }
            .signature-title {
              font-size: 11px;
              font-weight: bold;
            }
            .footer {
              border-top: 1px dashed #cbd5e1;
              padding-top: 10px;
              font-size: 9px;
              color: #64748b;
              margin-top: 40px;
              text-align: center;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">SCF FLOTA - CONTROL LOGÍSTICO</h1>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Acta Oficial de Control y Entrega Técnica</div>
            </div>
            <div class="badge-ot">REGISTRO ${log.id}</div>
          </div>

          <div style="text-align: right; font-size: 11px; color: #64748b; margin-bottom: 15px;">
            <strong>Fecha/Hora:</strong> ${log.fecha}
          </div>

          <div class="section-title">1. Identificación de Unidad</div>
          <div class="grid-info">
            <div class="info-item">
              <div class="info-label">Placa Patente (PPU)</div>
              <div class="info-value" style="font-family: monospace; color: #1d4ed8; font-size: 13px;">${log.ppu}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Código Interno Móvil</div>
              <div class="info-value" style="font-family: monospace;">${log.codigo_vehiculo}</div>
            </div>
            <div class="info-item" style="grid-span: 2;">
              <div class="info-label">Ficha Vehículo</div>
              <div class="info-value">${vehDetails}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Kilometraje registrado (Odómetro)</div>
              <div class="info-value font-mono">${log.odometro.toLocaleString()} km</div>
            </div>
          </div>

          <div class="section-title">2. Checklist de Inspección (${log.tipo === 'Ingreso' ? 'Recepción' : 'Salida'})</div>
          <table>
            <thead>
              <tr>
                <th>Punto de Inspección Obligatorio</th>
                <th style="width: 200px; text-align: center;">Estado Concesionario</th>
              </tr>
            </thead>
            <tbody>
              ${checklistRows}
            </tbody>
          </table>

          <div class="section-title">3. Observaciones y Hallazgos</div>
          <div class="comments-box">
            ${log.observaciones || 'No se detallan observaciones adicionales.'}
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div style="height: 50px;"></div>
              <div class="signature-title">${log.responsable}</div>
              <div class="signature-subtitle">Firma Responsable Logístico / Conductor</div>
            </div>
            <div class="signature-box">
              <div style="height: 50px;"></div>
              <div class="signature-title">Encargado de Taller Autorizado</div>
              <div class="signature-subtitle">Firma de Entrega / Recepción Conforme</div>
            </div>
          </div>

          <div class="footer">
            ACTA DE REGISTRO DOCUMENTAL EMITIDA MEDIANTE CONSOLA DE CONTROL DE FLOTA SCF
            <div style="margin-top: 5px;">Este control es indispensable para la cobertura de pólizas de seguro e inspección técnica fiscal.</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id={`workshop-${mode}-tab`}>
      {/* Tab Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-slate-900" />
            {mode === 'recepcion' ? 'Recepción de Vehículos (Ingreso a Taller)' : 'Salida de Vehículos (Egreso de Taller)'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'recepcion' 
              ? 'Realice un checklist básico de la unidad física antes de ingresarla a la bitácora de taller. Cambia automáticamente el estado a Mantenimiento.' 
              : 'Verifique los controles de calidad y odómetro antes de devolver la unidad a estado Operativo.'}
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`font-semibold rounded-xl text-xs py-2.5 px-4 inline-flex items-center gap-1.5 transition-all shadow-md shrink-0 text-white ${
            mode === 'recepcion' ? 'bg-indigo-650 hover:bg-indigo-700' : 'bg-emerald-650 hover:bg-emerald-700'
          }`}
          id="btn-add-workshop-log"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'Cerrar Formulario' : mode === 'recepcion' ? 'Registrar Recepción (Ingreso)' : 'Registrar Salida (Egreso)'}
        </button>
      </div>

      {/* Checklist Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left max-w-2xl mx-auto space-y-4" id="workshop-log-form">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-indigo-650" />
            Checklist de Control - {mode === 'recepcion' ? 'Ingreso a Taller' : 'Salida de Taller'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patente Dropdown */}
            <div>
              <label htmlFor="select-ppu" className="text-xs font-semibold text-slate-700 block mb-1">Vehículo (PPU)*</label>
              <select
                id="select-ppu"
                value={plate}
                onChange={(e) => handlePlateChange(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-bold"
                required
              >
                <option value="">Seleccione Vehículo...</option>
                {vehicles
                  .filter(v => mode === 'recepcion' ? v.estado !== 'Mantenimiento' : v.estado === 'Mantenimiento')
                  .concat(
                    // Fallback to let you select any vehicle just in case
                    vehicles.filter(v => mode === 'recepcion' ? v.estado === 'Mantenimiento' : v.estado !== 'Mantenimiento')
                  )
                  .map(v => (
                    <option key={v.ppu} value={v.ppu}>
                      {v.codigo_unico} ({v.ppu}) - {v.marca} {v.modelo} [Estado: {v.estado}]
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Kilometraje input */}
            <div>
              <label htmlFor="input-odometer" className="text-xs font-semibold text-slate-700 block mb-1">Odómetro Kilometraje*</label>
              <div className="relative">
                <input
                  type="number"
                  id="input-odometer"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-mono font-bold"
                  placeholder="Ej: 145000"
                  required
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-extrabold uppercase font-mono">KM</span>
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label htmlFor="input-date" className="text-xs font-semibold text-slate-700 block mb-1">Fecha Registro*</label>
              <div className="relative">
                <input
                  type="date"
                  id="input-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-mono"
                  required
                />
              </div>
            </div>

            {/* Hora */}
            <div>
              <label htmlFor="input-time" className="text-xs font-semibold text-slate-700 block mb-1">Hora Registro*</label>
              <div className="relative">
                <input
                  type="time"
                  id="input-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-mono"
                  required
                />
              </div>
            </div>

            {/* Conductor Responsable */}
            <div className="sm:col-span-2">
              <label htmlFor="input-responsible" className="text-xs font-semibold text-slate-700 block mb-1">Conductor / Responsable que Entrega*</label>
              <input
                type="text"
                id="input-responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                placeholder="Nombre del conductor responsable"
                required
              />
            </div>
          </div>

          {/* CHECKLIST ITEMS GRID */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-3">Inspección de Seguridad Básica (Checklist)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              
              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 shadow-xs cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-750">Luces y Señalizadores Operativos</span>
                <input
                  type="checkbox"
                  checked={luces}
                  onChange={(e) => setLuces(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 shadow-xs cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-750">Neumáticos en Buen Estado</span>
                <input
                  type="checkbox"
                  checked={neumaticos}
                  onChange={(e) => setNeumaticos(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 shadow-xs cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-750">Carrocería sin Golpes Nuevos</span>
                <input
                  type="checkbox"
                  checked={carroceria}
                  onChange={(e) => setCarroceria(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 shadow-xs cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-750">Herramientas y Rueda de Repuesto</span>
                <input
                  type="checkbox"
                  checked={herramientas}
                  onChange={(e) => setHerramientas(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 shadow-xs cursor-pointer select-none sm:col-span-2">
                <span className="text-xs font-semibold text-slate-750">Documentos del Vehículo a Bordo</span>
                <input
                  type="checkbox"
                  checked={documentos}
                  onChange={(e) => setDocumentos(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* Extra Quality checks for exit mode only */}
              {mode === 'salida' && (
                <>
                  <div className="col-span-1 sm:col-span-2 border-t border-slate-200 my-1 pt-2">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Controles Adicionales de Calidad (Salida)</span>
                  </div>

                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 shadow-xs cursor-pointer select-none">
                    <span className="text-xs font-semibold text-slate-750">Limpieza Interior y Exterior</span>
                    <input
                      type="checkbox"
                      checked={limpieza}
                      onChange={(e) => setLimpieza(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 shadow-xs cursor-pointer select-none">
                    <span className="text-xs font-semibold text-slate-750">Niveles de Fluidos Revisados</span>
                    <input
                      type="checkbox"
                      checked={fluidos}
                      onChange={(e) => setFluidos(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150 shadow-xs cursor-pointer select-none sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-750">Prueba de Ruta y Test Funcional OK</span>
                    <input
                      type="checkbox"
                      checked={pruebaRuta}
                      onChange={(e) => setPruebaRuta(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Observations */}
          <div>
            <label htmlFor="input-comments" className="text-xs font-semibold text-slate-700 block mb-1">Observaciones / Detalles de Inspección</label>
            <textarea
              id="input-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg h-20 focus:ring-1 focus:ring-indigo-500"
              placeholder="Detalle rayones, fallas detectadas o comentarios sobre el estado general..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs text-white font-bold rounded-lg cursor-pointer ${
                mode === 'recepcion' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Guardar Acta
            </button>
          </div>
        </form>
      )}

      {/* Filters Toolbar */}
      <div className="max-w-xs text-left">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar bitácoras de taller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-300"
            id="workshop-search"
          />
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-left">
          <table className="w-full text-xs table-auto">
            <thead className="bg-slate-50 text-slate-550 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Folio ID</th>
                <th className="py-3 px-4">Patente PPU</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4 text-right">Odómetro</th>
                <th className="py-3 px-4">Conductor Responsable</th>
                <th className="py-3 px-4">Chequeos de Seguridad</th>
                <th className="py-3 px-4">Detalles Observaciones</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 italic">
                    No se registran actas de {mode === 'recepcion' ? 'ingreso' : 'salida'} de taller.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const passCount = Object.values(log.checklist).filter(v => v === true).length;
                  const totalChecks = Object.keys(log.checklist).length;
                  const isAllOk = passCount === totalChecks;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{log.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono bg-slate-100 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-slate-250">
                          {log.ppu}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">COD: {log.codigo_vehiculo}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">{log.fecha}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{log.odometro.toLocaleString()} km</td>
                      <td className="py-3.5 px-4 flex items-center gap-1.5 mt-2">
                        <User className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                        <span className="truncate max-w-[130px]">{log.responsable}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAllOk ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {isAllOk ? '✓ CONFORME' : `${passCount}/${totalChecks} PASAN`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate italic" title={log.observaciones}>
                        {log.observaciones || 'Sin detalles'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handlePrintLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold border border-indigo-100 transition-all cursor-pointer shadow-xs"
                          title="Imprimir Acta Oficial"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir Acta</span>
                        </button>
                      </td>
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
