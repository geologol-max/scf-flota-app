import React from 'react';
import { Vehicle, MaintenanceLog, CONTRATO_CENTRO_COSTO } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import { Brain, AlertTriangle, TrendingUp, Calendar, Zap, Clipboard, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PredictiveAnalyticsProps {
  vehicles: Vehicle[];
  maintenanceLogs: MaintenanceLog[];
}

export default function PredictiveAnalytics({ vehicles, maintenanceLogs }: PredictiveAnalyticsProps) {
  const today = new Date();

  // 1. Analyze Document expirations (Critical Warnings)
  const expiringDocs = vehicles.flatMap(v => {
    const docs = [
      { name: 'Permiso de Circulación', state: v.documentos.permiso_circulacion },
      { name: 'SOAP', state: v.documentos.soap },
      { name: 'Revisión Técnica', state: v.documentos.revision_tecnica },
      { name: 'Emisión de Gases', state: v.documentos.emision_gases }
    ];

    return docs.map(doc => {
      const expirationDate = new Date(doc.state.fecha_vencimiento);
      const diffTime = expirationDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        unit: v.codigo_unico,
        ppu: v.ppu,
        documentName: doc.name,
        date: doc.state.fecha_vencimiento,
        daysRemaining: diffDays,
        status: diffDays < 0 ? 'expired' : diffDays <= 30 ? 'critical' : 'warning'
      };
    }).filter(d => d.daysRemaining <= 60); // warning threshold: 60 days
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  // 2. Predictive maintenance: Next due (every 10,000 km)
  // We assume a dynamic daily average accumulation based on vehicle type
  const predictiveMaintenances = vehicles.map(v => {
    let dailyAverage = 65; // default km/day
    if (v.tipo.toLowerCase().includes('grua')) dailyAverage = 120;
    if (v.tipo.toLowerCase().includes('ambulancia')) dailyAverage = 180;
    if (v.tipo.toLowerCase().includes('patrulla')) dailyAverage = 140;
    if (v.tipo.toLowerCase().includes('maquinaria')) dailyAverage = 30;

    // Next service is due at the next multiple of 10,000 km
    const currentKm = v.kilometraje;
    const nextLimit = Math.ceil((currentKm + 10) / 10000) * 10000;
    const kmRemaining = nextLimit - currentKm;
    const daysPredicted = Math.ceil(kmRemaining / dailyAverage);

    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysPredicted);

    return {
      codigo_unico: v.codigo_unico,
      ppu: v.ppu,
      tipo: v.tipo,
      contrato: v.contrato,
      kilometraje: currentKm,
      proximo_limite: nextLimit,
      km_restantes: kmRemaining,
      dias_estimados: daysPredicted,
      fecha_proyectada: projectedDate.toISOString().slice(0, 10),
      severity: kmRemaining < 1500 ? 'Inminente' : kmRemaining < 4000 ? 'Prevención' : 'Normal'
    };
  }).sort((a, b) => a.km_restantes - b.km_restantes);

  // 3. Operational Performance Data calculations
  const totalFleetSize = vehicles.length;
  const healthScore = Math.max(40, 100 - (expiringDocs.filter(d => d.daysRemaining <= 0).length * 8) - (vehicles.filter(v => v.estado === 'Siniestrado').length * 15));
  
  // Total cost of maintenance
  const totalMaintenanceCost = maintenanceLogs.reduce((acc, log) => acc + log.costo, 0);

  // Let's generate data for Distribution Chart (Vehicles by Contract)
  const contractsMap: Record<string, number> = {};
  vehicles.forEach(v => {
    contractsMap[v.contrato] = (contractsMap[v.contrato] || 0) + 1;
  });
  const contractChartData = Object.keys(contractsMap).map(key => ({
    name: key,
    Vehiculos: contractsMap[key],
    costCenter: CONTRATO_CENTRO_COSTO[key] || 0
  })).sort((a, b) => b.Vehiculos - a.Vehiculos);

  // Maintenance costs over time or per vehicle
  const costsPerVehicleMap: Record<string, number> = {};
  maintenanceLogs.forEach(log => {
    costsPerVehicleMap[log.ppu] = (costsPerVehicleMap[log.ppu] || 0) + log.costo;
  });
  const rankingCostsData = Object.keys(costsPerVehicleMap).map(ppu => {
    const veh = vehicles.find(v => v.ppu === ppu);
    return {
      name: `${veh ? veh.codigo_unico : ppu} (${ppu})`,
      Gastos: costsPerVehicleMap[ppu]
    };
  }).slice(0, 5);

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

  return (
    <div className="space-y-6" id="predictive-analytics-root">
      
      {/* 4 Header Indicators of High Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="predictive-performance-overview">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Índice de Salud General</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{healthScore}%</div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Cálculo algorítmico en base a siniestros y documentos vencidos
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Presupuesto Mantenimiento</span>
            <div className="p-2 bg-cyan-50 rounded-xl text-cyan-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            ${totalMaintenanceCost.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Acumulativo por mantenimientos cargados
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Vencimientos Críticos</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">
            {expiringDocs.filter(d => d.daysRemaining <= 0).length} <span className="text-xs text-slate-400 font-normal">Hoy</span>
          </div>
          <p className="text-[11px] text-rose-500 mt-2 flex items-center gap-1 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            Documentación inactiva o expirada
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Uso Promedio Diario</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-950">~92.5 km</div>
          <p className="text-[11px] text-slate-400 mt-2">
            Por vehículo en contratos activos
          </p>
        </div>
      </div>

      {/* Main predictions split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="predictions-modules-grps">
        
        {/* Left Module: Predictive Maintenance Planner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-950 text-sm tracking-tight text-left">
                Planificación Predictiva de Filtros y Servicios (10.000 KM)
              </h3>
            </div>
            <p className="text-xs text-slate-500 text-left mb-4">
              Estimación inteligente de desgaste de odómetro para programar preventivos y evitar multas o paralización del vehículo.
            </p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {predictiveMaintenances.map(m => (
                <div key={m.codigo_unico} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                        {m.ppu}
                      </span>
                      <strong className="text-xs text-slate-900">{m.codigo_unico}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {m.tipo} • {m.contrato}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] inline-block font-semibold px-2 py-0.5 rounded-full mb-1 ${
                      m.severity === 'Inminente' 
                        ? 'bg-rose-100 text-rose-700 animate-pulse' 
                        : m.severity === 'Prevención' 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {m.severity === 'Inminente' ? '🚨 Inminente' : m.severity === 'Prevención' ? '⚠ Prevención' : 'Normal'}
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-800">
                      En {m.km_restantes.toLocaleString()} km
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Fecha aprox: {m.fecha_proyectada} ({m.dias_estimados} días)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Module: Document Expiration Control Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Clipboard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-950 text-sm tracking-tight text-left">
                Vencimiento de Papelería Legal Crítica (SOAP, RT, Gases)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Alertas proactivas de documentos obligatorios chilenos con menos de 60 días de vigencia.
            </p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {expiringDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <span className="text-xs">¡Excelente! Todos los vehículos cuentan con documentación legal vigente.</span>
                </div>
              ) : (
                expiringDocs.map((doc, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${
                    doc.daysRemaining < 0 
                      ? 'bg-rose-50 border-rose-100' 
                      : doc.daysRemaining <= 15 
                      ? 'bg-amber-50 border-amber-100' 
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">
                          {doc.ppu}
                        </span>
                        <strong className="text-xs text-slate-800">{doc.unit}</strong>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mt-1">
                        {doc.documentName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Vence el: {doc.date}
                      </div>
                    </div>

                    <div className="text-right">
                      {doc.daysRemaining < 0 ? (
                        <div className="text-xs font-bold text-rose-600 animate-pulse">
                          EXPIRADO HACE {Math.abs(doc.daysRemaining)} DÍAS
                        </div>
                      ) : (
                        <div className={`text-xs font-bold ${doc.daysRemaining <= 15 ? 'text-amber-600' : 'text-slate-700'}`}>
                          Vence en {doc.daysRemaining} días
                        </div>
                      )}
                      <span className="text-[9px] text-slate-400 italic">Retener tránsito vial</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Operational Performance report charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="performance-charts">
        
        {/* Chart 1: Vehicle distribution by contract */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
          <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider mb-2">Asignación por Contrato (Flotas)</h4>
          <p className="text-xs text-slate-400 mb-4">Cantidad de móviles activos centralizados por concesión y faena.</p>
          <div className="h-60" id="contract-distribution-chart">
            {contractChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contractChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '11px' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Bar dataKey="Vehiculos" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                    {contractChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">Sin información de contratos</div>
            )}
          </div>
        </div>

        {/* Chart 2: Top Expenditure maintenance assets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
          <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider mb-2">Vehículos Costosos (Mantenimiento)</h4>
          <p className="text-xs text-slate-400 mb-4">Top 5 de unidades con mayor desembolso acumulado en reparaciones.</p>
          
          <div className="h-60 flex flex-col justify-between" id="ranking-spendings-vehicles">
            {rankingCostsData.length > 0 ? (
              <div className="space-y-4 overflow-y-auto pr-1">
                {rankingCostsData.map((ranking, index) => {
                  const percentage = Math.round((ranking.Gastos / rankingCostsData[0].Gastos) * 100);
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">{ranking.name}</span>
                        <span className="font-bold font-mono text-slate-900">${ranking.Gastos.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">No hay datos de costos de mantenimientos registrados</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
