import { Vehicle, SupervisorFleetLog } from '../types';

/**
 * Generates an Excel-compatible CSV file (with UTF-8 Byte Order Mark)
 * for the supervisor's fleet tracking and updates.
 */
export function exportSupervisorFleetToExcel(
  vehicles: Vehicle[],
  logs: SupervisorFleetLog[],
  contractName: string
): void {
  const headers = [
    'Patente (PPU)',
    'Código de Flota',
    'Marca',
    'Modelo',
    'Año',
    'Tipo de Unidad',
    'Contrato',
    'Centro Costo',
    'Kilometraje Actual (Odómetro)',
    'Estado Semana Activa',
    'Última Carga Combustible (Proveedor)',
    'Última Carga (Litros)',
    'Última Carga (Monto)',
    'Fecha Última Actualización'
  ];

  const rows = vehicles.map(v => {
    // Find last log inside this week or overall for this vehicle
    const sortedLogs = logs
      .filter(l => l.ppu === v.ppu)
      .sort((a, b) => new Date(b.fecha_actualizacion).getTime() - new Date(a.fecha_actualizacion).getTime());
    const lastLog = sortedLogs[0];

    // Determine status
    let statusText = 'Pendiente';
    if (lastLog) {
      statusText = 'Actualizado';
    }

    const lastFuelProv = lastLog?.combustible?.proveedor || 'N/A';
    const lastFuelLitres = lastLog?.combustible?.litros || 0;
    const lastFuelTotal = lastLog?.combustible?.monto_total || 0;
    const lastDate = lastLog?.fecha_actualizacion || 'Nunca';

    return [
      v.ppu,
      v.codigo_unico,
      v.marca,
      v.modelo,
      v.anio,
      v.tipo,
      v.contrato,
      v.centro_costo,
      v.kilometraje,
      statusText,
      lastFuelProv,
      lastFuelLitres,
      lastFuelTotal,
      lastDate
    ];
  });

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(';'), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `FLOTA_SUPERVISOR_${contractName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers a browser print window with a highly polished PDF print template
 * for the supervisor's contract fleet status and fuel loading logs.
 */
export function exportSupervisorFleetToPDF(
  vehicles: Vehicle[],
  logs: SupervisorFleetLog[],
  contractName: string,
  supervisorName: string
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor habilite los pop-ups para descargar el reporte en formato PDF.');
    return;
  }

  const now = new Date().toLocaleString();

  // Prepare table of vehicles
  const vehicleRows = vehicles.map(v => {
    const vLogs = logs.filter(l => l.ppu === v.ppu);
    const sortedLogs = [...vLogs].sort(
      (a, b) => new Date(b.fecha_actualizacion).getTime() - new Date(a.fecha_actualizacion).getTime()
    );
    const lastLog = sortedLogs[0];
    const fuelLogs = vLogs.filter(l => l.combustible);
    const totalFuelCLP = fuelLogs.reduce((sum, l) => sum + (l.combustible?.monto_total || 0), 0);

    return `
      <tr>
        <td style="font-family: monospace; font-weight: bold; color: #1d4ed8; padding: 10px; border-bottom: 1px solid #e2e8f0;">${v.ppu}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${v.marca} ${v.modelo}</td>
        <td style="font-family: monospace; text-align: right; padding: 10px; border-bottom: 1px solid #e2e8f0;">${v.kilometraje.toLocaleString()} km</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background-color: ${lastLog ? '#d1fae5; color: #065f46' : '#fef3c7; color: #92400e'}">
            ${lastLog ? 'ACTUALIZADO' : 'PENDIENTE'}
          </span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; text-align: right;">
          $${totalFuelCLP.toLocaleString()}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
          ${lastLog ? lastLog.fecha_actualizacion : 'Sin reporte'}
        </td>
      </tr>
    `;
  }).join('');

  // Prepare table of fuel transactions
  const fuelLoads = logs.filter(l => l.combustible);
  const fuelRows = fuelLoads.length === 0
    ? `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">No se han registrado cargas de combustible para este ciclo.</td></tr>`
    : fuelLoads.map(log => `
      <tr>
        <td style="font-family: monospace; font-weight: bold; padding: 8px; border-bottom: 1px solid #e2e8f0;">${log.ppu}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${log.fecha_actualizacion}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${log.combustible?.proveedor === 'Copec' ? '#ea580c' : '#2563eb'}">${log.combustible?.proveedor}</td>
        <td style="font-family: monospace; text-align: right; padding: 8px; border-bottom: 1px solid #e2e8f0;">${log.combustible?.litros.toLocaleString()} L</td>
        <td style="font-family: monospace; text-align: right; padding: 8px; border-bottom: 1px solid #e2e8f0;">$${log.combustible?.valor_combustible.toLocaleString()}</td>
        <td style="font-family: monospace; text-align: right; padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">$${log.combustible?.monto_total.toLocaleString()}</td>
      </tr>
    `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte de Supervisión - Flota ${contractName}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 40px;
            line-height: 1.5;
            font-size: 12px;
          }
          .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            margin: 0;
          }
          .subtitle {
            font-size: 10px;
            color: #64748b;
            margin-top: 4px;
          }
          .badge {
            background-color: #0f172a;
            color: white;
            padding: 6px 12px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 4px;
          }
          .section-title {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #f1f5f9;
            padding: 6px 10px;
            margin-top: 24px;
            margin-bottom: 12px;
            border-left: 4px solid #1e293b;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            padding: 8px 10px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
          }
          .footer {
            border-top: 1px solid #cbd5e1;
            padding-top: 12px;
            font-size: 9px;
            color: #64748b;
            margin-top: 50px;
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
            <h1 class="title">REPORTE SEMANAL DE SUPERVISIÓN</h1>
            <div class="subtitle">CONTRATO: ${contractName} • OPERADO PARA NERA CHILE SPA</div>
          </div>
          <div class="badge">CONTRATO: ${contractName}</div>
        </div>

        <div style="font-size: 11px; margin-bottom: 20px; display: flex; justify-content: space-between;">
          <div>
            <strong>Supervisor Responsable:</strong> ${supervisorName}<br>
            <strong>Plazo de Entrega:</strong> Lunes 09:00 AM - Viernes 10:00 AM
          </div>
          <div style="text-align: right;">
            <strong>Fecha de Impresión:</strong> ${now}
          </div>
        </div>

        <div class="section-title">1. Estado de Actualización de Unidades</div>
        <table>
          <thead>
            <tr>
              <th>PPU (Patente)</th>
              <th>Vehículo / Modelo</th>
              <th>Odómetro Registrado</th>
              <th style="text-align: center;">Estado Semana</th>
              <th style="text-align: right;">Consumo Total ($)</th>
              <th>Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            ${vehicleRows}
          </tbody>
        </table>

        <div class="section-title">2. Bitácora de Cargas de Combustible Registradas</div>
        <table>
          <thead>
            <tr>
              <th>PPU (Patente)</th>
              <th>Fecha y Hora</th>
              <th>Distribuidora</th>
              <th style="text-align: right;">Volumen (Litros)</th>
              <th style="text-align: right;">Precio/Lt</th>
              <th style="text-align: right;">Monto Total</th>
            </tr>
          </thead>
          <tbody>
            ${fuelRows}
          </tbody>
        </table>

        <div class="footer">
          <div>DOCUMENTO EXPORTADO POR EL PORTAL DE CONTROL DE FLOTA SCF</div>
          <div style="margin-top: 5px;">Rendición válida para auditorías de rendimiento termodinámico de combustible contratados de Nera Chile SPA.</div>
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
}
