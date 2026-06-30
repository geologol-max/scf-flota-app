import { Vehicle, FleetMovementLog, MaintenanceLog } from '../types';

/**
 * Generates an Excel-compatible CSV file (with UTF-8 Byte Order Mark for Spanish support)
 * representing the current state of the fleet.
 */
export function exportToExcel(vehicles: Vehicle[]): void {
  const headers = [
    'Código Único',
    'PPU (Patente)',
    'Marca',
    'Modelo',
    'Año',
    'Tipo Vehículo',
    'Proveedor GPS',
    'Tarjeta Combustible',
    'N° TAG',
    'Kilometraje (odómetro)',
    'Contrato',
    'Centro de Costo',
    'Proveedor Leasing/Owner',
    'Estado Operativo',
    'Conductor',
    'Vencimiento Permiso Circulación',
    'Cargado Permiso',
    'Vencimiento SOAP',
    'Cargado SOAP',
    'Vencimiento Revisión Técnica',
    'Cargado RT',
    'Vencimiento Emisión Gases',
    'Cargado Gases'
  ];

  const rows = vehicles.map(v => [
    v.codigo_unico,
    v.ppu,
    v.marca,
    v.modelo,
    v.anio,
    v.tipo,
    v.gps_proveedor,
    v.tarjeta_combustible,
    v.numero_tag,
    v.kilometraje,
    v.contrato,
    v.centro_costo,
    v.proveedor,
    v.estado,
    v.chofer || 'No asignado',
    v.documentos.permiso_circulacion.fecha_vencimiento,
    v.documentos.permiso_circulacion.cargado ? 'SÍ' : 'NO',
    v.documentos.soap.fecha_vencimiento,
    v.documentos.soap.cargado ? 'SÍ' : 'NO',
    v.documentos.revision_tecnica.fecha_vencimiento,
    v.documentos.revision_tecnica.cargado ? 'SÍ' : 'NO',
    v.documentos.emision_gases.fecha_vencimiento,
    v.documentos.emision_gases.cargado ? 'SÍ' : 'NO'
  ]);

  // Use semicolon for perfect standard Excel recognition in Spanish localizations
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(val => {
      // Escape semicolons and double quotes
      const str = String(val).replace(/"/g, '""');
      return str.indexOf(';') >= 0 || str.indexOf('"') >= 0 || str.indexOf('\n') >= 0 ? `"${str}"` : str;
    }).join(';'))
  ].join('\n');

  // UTF-8 BOM indicator so Excel opens with proper encoding
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `Auditoria_Flota_${now}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Builds and opens an advanced, print-formatted modal ledger that triggers
 * the browser's PDF Generation/Print mechanism, perfectly customized for audits.
 */
export function triggerPDFPrint(vehicles: Vehicle[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor habilite los pop-ups para descargar la auditoría en formato PDF.');
    return;
  }

  const now = new Date().toLocaleString();
  const totalVehicles = vehicles.length;
  const inService = vehicles.filter(v => v.estado === 'Operativo').length;
  const inMaintenance = vehicles.filter(v => v.estado === 'Mantenimiento').length;
  const inIncident = vehicles.filter(v => v.estado === 'Siniestrado').length;

  const expiredDocsCount = vehicles.reduce((acc, v) => {
    let count = 0;
    const today = new Date();
    Object.values(v.documentos).forEach(doc => {
      if (new Date(doc.fecha_vencimiento) < today) {
        count++;
      }
    });
    return acc + count;
  }, 0);

  const tableRows = vehicles.map(v => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: center;">${v.codigo_unico}</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #1e3a8a;">${v.ppu}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${v.marca} ${v.modelo} (${v.anio})</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${v.tipo}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${v.contrato} <span style="font-size: 0.8em; color: #666;">(CC ${v.centro_costo})</span></td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${v.kilometraje.toLocaleString()} km</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
        <span style="padding: 3px 6px; border-radius: 4px; font-size: 0.85em; font-weight: bold; 
          background-color: ${v.estado === 'Operativo' ? '#dcfce7; color: #166534' : v.estado === 'Mantenimiento' ? '#fef9c3; color: #854d0e' : '#fee2e2; color: #991b1b'}">
          ${v.estado}
        </span>
      </td>
      <td style="border: 1px solid #ddd; padding: 8px; font-size: 0.8em;">
        Permiso: ${v.documentos.permiso_circulacion.fecha_vencimiento} ${new Date(v.documentos.permiso_circulacion.fecha_vencimiento) < new Date() ? '❌' : '✅'}<br/>
        SOAP: ${v.documentos.soap.fecha_vencimiento} ${new Date(v.documentos.soap.fecha_vencimiento) < new Date() ? '❌' : '✅'}<br/>
        Rev. Técnica: ${v.documentos.revision_tecnica.fecha_vencimiento} ${new Date(v.documentos.revision_tecnica.fecha_vencimiento) < new Date() ? '❌' : '✅'}
      </td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Auditoría de Flota Oficial - ${now}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 40px;
            line-height: 1.4;
          }
          .header {
            border-bottom: 3px double #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
          }
          .subtitle {
            font-size: 14px;
            color: #555;
            margin-top: 5px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .summary-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
          }
          .summary-val {
            font-size: 20px;
            font-weight: bold;
            color: #1e293b;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 40px;
          }
          th {
            background-color: #0f172a;
            color: white;
            font-weight: bold;
            text-align: left;
            padding: 10px 8px;
            border: 1px solid #334155;
          }
          .footer {
            border-top: 1px solid #777;
            padding-top: 10px;
            font-size: 10px;
            color: #777;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h1 class="title">SISTEMA CONTROL DE FLOTA</h1>
              <div class="subtitle">Reporte de Auditoría Interna de Activos Logísticos</div>
            </div>
            <div style="text-align: right; font-size: 12px;">
              <strong>Fecha:</strong> ${now}<br/>
              <strong>ID Solicitud:</strong> AUD-FL-${Math.floor(Math.random() * 90000 + 10000)}<br/>
              <strong>Clasificación:</strong> Confidencial Operaciones
            </div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b;">Total de Vehículos</div>
            <div class="summary-val">${totalVehicles}</div>
          </div>
          <div class="summary-card">
            <div style="font-size: 10px; text-transform: uppercase; color: #16a34a;">Vehículos Operativos</div>
            <div class="summary-val">${inService}</div>
          </div>
          <div class="summary-card">
            <div style="font-size: 10px; text-transform: uppercase; color: #ca8a04;">En Mantenimiento</div>
            <div class="summary-val">${inMaintenance}</div>
          </div>
          <div class="summary-card">
            <div style="font-size: 10px; text-transform: uppercase; color: #ef4444;">Documentos Vencidos</div>
            <div class="summary-val" style="color: ${expiredDocsCount > 0 ? '#b91c1c' : '#1e293b'}">${expiredDocsCount}</div>
          </div>
        </div>

        <h3 style="margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Inventario Detallado de Flota</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 80px;">Cód. Único</th>
              <th style="width: 80px;">PPU (Patente)</th>
              <th>Marca - Modelo - Año</th>
              <th>Tipo de Vehículo</th>
              <th>Contrato & Centro Costo</th>
              <th style="width: 90px; text-align: right;">Odómetro</th>
              <th style="width: 80px; text-align: center;">Estado</th>
              <th>Vencimientos Críticos</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="background-color: #fcf8e3; border: 1px solid #fbeed5; border-radius: 4px; padding: 12px; margin-bottom: 40px; font-size: 11px;">
          <strong>Nota de Auditoría de Documentos:</strong> Los registros indicados con ❌ poseen retraso en la renovación obligatoria chilena (Permiso de Circulación, SOAP o Revisión Técnica). Es imperativo restringir el transitado vial de dichos vehículos para evitar multas de tránsito clase A y retrasos del seguro institucional.
        </div>

        <div class="footer">
          <div>Reporte Oficial - Generado mediante Sistema de Control de Flota</div>
          <div>Página 1 de 1</div>
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

/**
 * Generates an Excel-compatible CSV file (with UTF-8 Byte Order Mark for Spanish support)
 * representing the movements history log of the fleet.
 */
export function exportMovementsToExcel(movements: FleetMovementLog[]): void {
  const headers = [
    'Código Folio',
    'PPU (Patente)',
    'ID Vehículo',
    'Tipo Registro',
    'Fecha Traspaso',
    'Contrato Origen',
    'Contrato Destino',
    'Operador Responsable',
    'Detalle / Justificación'
  ];

  const rows = movements.map(m => [
    m.id,
    m.ppu,
    m.codigo_vehiculo,
    m.tipo_movimiento,
    m.fecha,
    m.contrato_origen || 'No asignado',
    m.contrato_destino,
    m.operador,
    m.comentario
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(val => {
      // Escape semicolons and double quotes
      const str = String(val).replace(/"/g, '""');
      return str.indexOf(';') >= 0 || str.indexOf('"') >= 0 || str.indexOf('\n') >= 0 ? `"${str}"` : str;
    }).join(';'))
  ].join('\n');

  // UTF-8 BOM indicator so Excel opens with proper encoding
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `Bitacora_Movimientos_${now}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Builds and opens an advanced, print-formatted modal ledger that triggers
 * the browser's PDF Generation/Print mechanism, customized for Movements history.
 */
export function triggerMovementsPDFPrint(movements: FleetMovementLog[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor habilite los pop-ups para descargar la bitácora de movimientos en formato PDF.');
    return;
  }

  const now = new Date().toLocaleString();
  const totalMovements = movements.length;
  const entradas = movements.filter(m => m.tipo_movimiento === 'Entrada').length;
  const salidas = movements.filter(m => m.tipo_movimiento === 'Salida').length;
  const cambios = movements.filter(m => m.tipo_movimiento === 'Cambio de Contrato').length;

  const tableRows = movements.map(m => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: center; font-family: monospace;">${m.id}</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #1e3a8a; text-align: center; font-family: monospace;">${m.ppu}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-family: monospace;">${m.codigo_vehiculo}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
        <span style="padding: 3px 6px; border-radius: 4px; font-size: 0.85em; font-weight: bold; 
          background-color: ${m.tipo_movimiento === 'Entrada' ? '#e2f0d9; color: #385723' : m.tipo_movimiento === 'Salida' ? '#fce4d6; color: #c65911' : '#fff2cc; color: #7f6000'}">
          ${m.tipo_movimiento}
        </span>
      </td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-family: monospace;">${m.fecha}</td>
      <td style="border: 1px solid #ddd; padding: 8px; color: #555; font-style: italic;">${m.contrato_origen || 'No aplicable'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #203764;">${m.contrato_destino}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${m.operador}</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-size: 0.95em;">${m.comentario}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Bitácora de Movimientos y Traspasos - ${now}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 40px;
            line-height: 1.4;
          }
          .header {
            border-bottom: 3px double #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
          }
          .subtitle {
            font-size: 14px;
            color: #555;
            margin-top: 5px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .summary-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
          }
          .summary-val {
            font-size: 20px;
            font-weight: bold;
            color: #1e293b;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 40px;
          }
          th {
            background-color: #0f172a;
            color: white;
            font-weight: bold;
            text-align: left;
            padding: 10px 8px;
            border: 1px solid #334155;
          }
          .footer {
            border-top: 1px solid #777;
            padding-top: 10px;
            font-size: 10px;
            color: #777;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h1 class="title">SISTEMA CONTROL DE FLOTA</h1>
              <div class="subtitle">Bitácora Oficial de Traspasos y Asignación de Contratos</div>
            </div>
            <div style="text-align: right; font-size: 12px;">
              <strong>Fecha Emisión:</strong> ${now}<br/>
              <strong>ID Reporte:</strong> RPT-MOV-${Math.floor(Math.random() * 90000 + 10000)}<br/>
              <strong>Clasificación:</strong> Registro Histórico Operaciones
            </div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b;">Total de Registros</div>
            <div class="summary-val">${totalMovements}</div>
          </div>
          <div class="summary-card">
            <div style="font-size: 10px; text-transform: uppercase; color: #385723;">Entradas (Altas)</div>
            <div class="summary-val" style="color: #385723;">${entradas}</div>
          </div>
          <div class="summary-card">
            <div style="font-size: 10px; text-transform: uppercase; color: #c65911;">Salidas (Bajas)</div>
            <div class="summary-val" style="color: #c65911;">${salidas}</div>
          </div>
          <div class="summary-card">
            <div style="font-size: 10px; text-transform: uppercase; color: #7f6000;">Cambios de Contrato</div>
            <div class="summary-val" style="color: #7f6000;">${cambios}</div>
          </div>
        </div>

        <h3 style="margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Bitácora de Eventos</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 80px; text-align: center;">Código Folio</th>
              <th style="width: 80px; text-align: center;">Unidad (PPU)</th>
              <th style="width: 80px; text-align: center;">ID Interno</th>
              <th style="width: 100px; text-align: center;">Tipo Registro</th>
              <th style="width: 80px; text-align: center;">Fecha</th>
              <th>Contrato Origen</th>
              <th>Contrato Destino</th>
              <th style="width: 120px;">Operador Responsable</th>
              <th>Detalle / Justificación</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <div>Reporte Oficial de Bitácoras de Movimiento - Generado mediante Sistema de Control de Flota</div>
          <div>Página 1 de 1</div>
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

/**
 * Triggers a browser print window with a highly polished PDF print template
 * for an individual Work Order / Maintenance Log (Orden de Trabajo/Mantención).
 * Includes fields like cost center, contract, responsible person, and
 * signatures for who issues ("Emite") and who receives ("Recibe").
 */
export function exportMaintenanceOrderToPDF(log: MaintenanceLog, vehicle?: Vehicle): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor habilite los pop-ups para descargar la orden de trabajo en formato PDF.');
    return;
  }

  const now = new Date().toLocaleString();
  const costFormatted = log.costo ? `$${log.costo.toLocaleString()}` : '$0';
  const kmFormatted = log.kilometraje ? `${log.kilometraje.toLocaleString()} km` : 'No especificado';
  const contract = log.contrato || (vehicle ? vehicle.contrato : 'No asignado');
  const costCenter = log.centro_costo !== undefined ? log.centro_costo : (vehicle ? vehicle.centro_costo : 'No asignado');
  const responsible = log.responsable || 'Administrador de Flota';

  printWindow.document.write(`
    <html>
      <head>
        <title>Orden de Trabajo N° ${log.id}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 40px;
            line-height: 1.5;
            font-size: 13px;
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
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
          }
          .subtitle {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
          }
          .badge-ot {
            background-color: #0f172a;
            color: white;
            padding: 6px 12px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 4px;
            font-family: monospace;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #f1f5f9;
            padding: 6px 10px;
            margin-top: 24px;
            margin-bottom: 12px;
            border-left: 4px solid #0f172a;
            color: #0f172a;
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
            font-size: 10px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .info-value {
            font-size: 13px;
            color: #0f172a;
            font-weight: 500;
          }
          .text-block {
            background-color: #fafafa;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            min-height: 80px;
            white-space: pre-wrap;
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
            color: #0f172a;
            text-transform: uppercase;
          }
          .signature-subtitle {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
          }
          .footer {
            border-top: 1px dashed #cbd5e1;
            padding-top: 12px;
            font-size: 9px;
            color: #64748b;
            margin-top: 50px;
            text-align: center;
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">SCF FLOTA - PORTAL DE MANTENCIONES</h1>
            <div class="subtitle">Consola de Control Reguladora S.A. • Chile</div>
          </div>
          <div class="badge-ot">ORDEN DE TRABAJO #${log.id}</div>
        </div>

        <div style="font-size: 11px; color: #64748b; text-align: right; margin-bottom: 12px;">
          <strong>Emitido el:</strong> ${log.fecha} (Impreso: ${now})
        </div>

        <div class="section-title">1. Información del Vehículo y Contrato</div>
        <div class="grid-info">
          <div class="info-item">
            <div class="info-label">Placa Patente Única (PPU)</div>
            <div class="info-value" style="font-family: monospace; font-weight: bold; color: #1d4ed8;">${log.ppu}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Código Interno de Flota</div>
            <div class="info-value" style="font-family: monospace;">${log.codigo_vehiculo}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Contrato en Operación</div>
            <div class="info-value">${contract}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Centro de Costo Vinculado</div>
            <div class="info-value">CC ${costCenter}</div>
          </div>
          ${vehicle ? `
          <div class="info-item">
            <div class="info-label">Detalles de Unidad</div>
            <div class="info-value">${vehicle.marca} ${vehicle.modelo} (${vehicle.anio})</div>
          </div>
          <div class="info-item">
            <div class="info-label">Proveedor Leasing</div>
            <div class="info-value">${vehicle.proveedor}</div>
          </div>
          ` : ''}
        </div>

        <div class="section-title">2. Detalles de Planificación y Taller Autorizado</div>
        <div class="grid-info">
          <div class="info-item">
            <div class="info-label">Taller Ejecutor Destino</div>
            <div class="info-value" style="font-weight: bold;">${log.taller}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Tipo de Servicio Solicitado</div>
            <div class="info-value" style="color: #4338ca; font-weight: bold;">${log.tipo_servicio}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Kilometraje Programado (Odómetro)</div>
            <div class="info-value" style="font-family: monospace;">${kmFormatted}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Costo Estimado Presupuesto (Neto)</div>
            <div class="info-value" style="font-family: monospace; font-weight: bold; color: #15803d;">${costFormatted}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Responsable de Emisión / Autoriza</div>
            <div class="info-value">${responsible}</div>
          </div>
        </div>

        <div class="section-title">3. Detalle y Justificación de Trabajos Requeridos</div>
        <div class="text-block">
          ${log.descripcion}
        </div>

        <div class="section-title">4. Firmas y Concesiones de Recepción y Control</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 24px;">
          Al firmar a continuación, se autoriza la ejecución de los trabajos mecánicos planificados y se valida la recepción conforme de la unidad física y los insumos correspondientes en el taller ejecutor.
        </div>
        
        <div class="signature-section">
          <div class="signature-box" style="margin-top: 40px;">
            <div style="height: 50px;"></div>
            <div class="signature-title">${responsible}</div>
            <div class="signature-subtitle">Firma Responsable Emisor<br/>Consola Control Logística</div>
          </div>
          <div class="signature-box" style="margin-top: 40px;">
            <div style="height: 50px;"></div>
            <div class="signature-title">Firma Encargado de Taller</div>
            <div class="signature-subtitle">Soporte Técnico / Taller Concesionario<br/>Recepción Conforme</div>
          </div>
        </div>

        <div class="footer">
          <div>ORDEN DE TRABAJO OFICIAL DE CONTROL DE FLOTA • GENERADO MEDIANTE S.C.F. WEB CONSOLE</div>
          <div style="margin-top: 40px;">Este documento tiene carácter regulatorio para su presentación ante la inspección técnica del contrato y validaciones de auditoría.</div>
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

