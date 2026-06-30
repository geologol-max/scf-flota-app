import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Vehicle, TipoVehiculo, ProveedorGPS, ProveedorCombustible, ProveedorLeasing, CONTRATO_CENTRO_COSTO, DocumentosVehiculo, UserPermissions } from '../types';
import { INITIAL_VEHICLE_TYPES } from '../mockData';
import { Plus, Table, Download, Upload, Trash2, Edit3, ShieldAlert, CheckCircle, FileText, AlertCircle, FileSpreadsheet, Search } from 'lucide-react';
import { exportToExcel, triggerPDFPrint } from '../utils/exporters';

interface VehicleInventoryProps {
  vehicles: Vehicle[];
  onUpdateVehicles: (v: Vehicle[]) => void;
  permissions: UserPermissions;
  customCategories: string[];
  onCreateCategory: (cat: string) => void;
}

export default function VehicleInventory({
  vehicles,
  onUpdateVehicles,
  permissions,
  customCategories,
  onCreateCategory
}: VehicleInventoryProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [newCat, setNewCat] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [ppu, setPpu] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [type, setType] = useState<string>('Grua Pesada');
  const [gps, setGps] = useState<string>('BlackGPS');
  const [fuelCard, setFuelCard] = useState<string>('Copec');
  const [tag, setTag] = useState('');
  const [odometer, setOdometer] = useState<number>(0);
  const [contract, setContract] = useState<string>('AVO');
  const [provider, setProvider] = useState<string>('SALFA');
  const [driver, setDriver] = useState('');
  const [estado, setEstado] = useState<'Operativo' | 'Mantenimiento' | 'Siniestrado' | 'Inactivo'>('Operativo');

  // Document expiration controls
  const [circulacionDate, setCirculacionDate] = useState('2027-03-31');
  const [soapDate, setSoapDate] = useState('2027-03-31');
  const [rtDate, setRtDate] = useState('2026-10-15');
  const [gasesDate, setGasesDate] = useState('2026-10-15');

  // Mock Upload state refs per vehicle
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocPPU, setUploadingDocPPU] = useState<{ ppu: string; docType: keyof DocumentosVehiculo } | null>(null);

  const allCategories = [...INITIAL_VEHICLE_TYPES, ...customCategories];

  const resetForm = () => {
    setCode(`FL-${Math.floor(Math.random() * 900 + 100)}`);
    setPpu('');
    setBrand('');
    setModel('');
    setYear(new Date().getFullYear());
    setType('Grua Pesada');
    setGps('BlackGPS');
    setFuelCard('Copec');
    setTag('');
    setOdometer(0);
    setContract('AVO');
    setProvider('SALFA');
    setDriver('');
    setEstado('Operativo');
    setCirculacionDate('2027-03-31');
    setSoapDate('2027-03-31');
    setRtDate('2026-10-15');
    setGasesDate('2026-10-15');
    setEditingVehicle(null);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCat.trim()) {
      onCreateCategory(newCat.trim());
      setType(newCat.trim());
      setNewCat('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.editar_flota) {
      alert('Su nivel de acceso no permite realizar modificaciones a la flota.');
      return;
    }

    // PPU Sanitization as requested: "se ingresa la PPU que es la patente del vehiculo sin espacios ni guiones"
    const sanitizedPpu = ppu.replace(/[\s-]/g, '').toUpperCase();

    if (!code || !sanitizedPpu || !brand || !model) {
      alert('Por favor complete los campos obligatorios: Código, PPU (Patente), Marca y Modelo.');
      return;
    }

    // Verify unique code on creating
    if (!editingVehicle && vehicles.some(v => v.codigo_unico === code)) {
      alert(`El código único ${code} ya está asignado a otro vehículo.`);
      return;
    }

    // Verify unique PPU on creating
    if (!editingVehicle && vehicles.some(v => v.ppu === sanitizedPpu)) {
      alert(`La PPU (Patente) ${sanitizedPpu} ya existe en el sistema.`);
      return;
    }

    const cc = CONTRATO_CENTRO_COSTO[contract] || 100;

    const savedDocState: DocumentosVehiculo = editingVehicle ? editingVehicle.documentos : {
      permiso_circulacion: { fecha_vencimiento: circulacionDate, cargado: false },
      soap: { fecha_vencimiento: soapDate, cargado: false },
      revision_tecnica: { fecha_vencimiento: rtDate, cargado: false },
      emision_gases: { fecha_vencimiento: gasesDate, cargado: false }
    };

    // If editing, overwrite dates
    if (editingVehicle) {
      savedDocState.permiso_circulacion.fecha_vencimiento = circulacionDate;
      savedDocState.soap.fecha_vencimiento = soapDate;
      savedDocState.revision_tecnica.fecha_vencimiento = rtDate;
      savedDocState.emision_gases.fecha_vencimiento = gasesDate;
    }

    const newVehicle: Vehicle = {
      codigo_unico: code,
      ppu: sanitizedPpu,
      marca: brand,
      modelo: model,
      anio: Number(year),
      tipo: type,
      gps_proveedor: gps,
      tarjeta_combustible: fuelCard,
      numero_tag: tag || `TAG-${Math.floor(Math.random() * 900000 + 100000)}`,
      kilometraje: Number(odometer),
      contrato: contract,
      centro_costo: cc,
      proveedor: provider,
      estado: estado,
      chofer: driver,
      documentos: savedDocState,
      coords: editingVehicle ? editingVehicle.coords : { lat: -33.456 + (Math.random() - 0.5) * 0.15, lng: -70.648 + (Math.random() - 0.5) * 0.15 },
      velocidad: editingVehicle ? editingVehicle.velocidad : 0
    };

    if (editingVehicle) {
      onUpdateVehicles(vehicles.map(v => v.ppu === editingVehicle.ppu ? newVehicle : v));
    } else {
      onUpdateVehicles([...vehicles, newVehicle]);
    }

    setIsAdding(false);
    resetForm();
  };

  const handleEdit = (v: Vehicle) => {
    if (!permissions.editar_flota) {
      alert('No cuenta con niveles de edición de flota.');
      return;
    }
    setEditingVehicle(v);
    setCode(v.codigo_unico);
    setPpu(v.ppu);
    setBrand(v.marca);
    setModel(v.modelo);
    setYear(v.anio);
    setType(v.tipo);
    setGps(v.gps_proveedor);
    setFuelCard(v.tarjeta_combustible);
    setTag(v.numero_tag);
    setOdometer(v.kilometraje);
    setContract(v.contrato);
    setProvider(v.proveedor);
    setDriver(v.chofer || '');
    setEstado(v.estado);

    setCirculacionDate(v.documentos.permiso_circulacion.fecha_vencimiento);
    setSoapDate(v.documentos.soap.fecha_vencimiento);
    setRtDate(v.documentos.revision_tecnica.fecha_vencimiento);
    setGasesDate(v.documentos.emision_gases.fecha_vencimiento);
    setIsAdding(true);
  };

  const handleDelete = (ppuToDelete: string) => {
    if (!permissions.editar_flota) {
      alert('Permisos insuficientes para eliminar vehículos.');
      return;
    }
    if (confirm('¿Está seguro de eliminar este vehículo de la flota activa? Se perderán sus bitácoras documentales asociadas.')) {
      onUpdateVehicles(vehicles.filter(v => v.ppu !== ppuToDelete));
    }
  };

  // Mock document actions
  const triggerDocUpload = (ppuVal: string, docType: keyof DocumentosVehiculo) => {
    if (!permissions.cargar_documentos) {
      alert('Nivel de acceso limitado: No posee permisos para cargar documentos legales.');
      return;
    }
    setUploadingDocPPU({ ppu: ppuVal, docType });
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocPPU) return;

    const updated = vehicles.map(v => {
      if (v.ppu === uploadingDocPPU.ppu) {
        const nextDocs = { ...v.documentos };
        nextDocs[uploadingDocPPU.docType] = {
          ...nextDocs[uploadingDocPPU.docType],
          cargado: true,
          nombre_archivo: file.name,
          contenidoSimulado: 'MOCK_BINARY_BASE64'
        };
        return { ...v, documentos: nextDocs };
      }
      return v;
    });

    onUpdateVehicles(updated);
    alert(`Documento "${file.name}" cargado exitosamente al vehículo con Patente ${uploadingDocPPU.ppu}`);
    setUploadingDocPPU(null);
  };

  const downloadDocument = (v: Vehicle, docType: keyof DocumentosVehiculo) => {
    if (!permissions.descargar_documentos) {
      alert('Acceso privado: Su rol no permite la descarga de documentos corporativos.');
      return;
    }
    const doc = v.documentos[docType];
    if (!doc.cargado) {
      alert('Este archivo no se encuentra cargado aún en el servidor.');
      return;
    }

    // Simulated browser download anchor
    const mockContent = `Documento De Flota Autogestionado\n=========================\nPatente: ${v.ppu}\nVehiculo: ${v.marca} ${v.modelo}\nTipo Documental: ${docType.toUpperCase()}\nVencimiento oficial: ${doc.fecha_vencimiento}\nArchivo: ${doc.nombre_archivo}\nSeguridad: Cifrado Operativo de Flota Logistica\nGenerado: ${new Date().toLocaleString()}`;
    const blob = new Blob([mockContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.nombre_archivo || `${docType}_${v.ppu}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Massive File Upload Excel Parser (Supports .xlsx, .xls)
  const handleMassiveExcelUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!permissions.carga_masiva) {
      alert('Su perfil administrativo no autoriza la carga masiva de inventarios.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet rows to matrix grid format
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rows.length < 2) {
          throw new Error('Formato inválido. El archivo de Excel debe poseer al menos la cabecera y una fila de datos.');
        }

        const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
        
        // Match columns dynamically by header names or fallback to fixed positions
        const getColIdx = (name: string, fallback: number) => {
          const found = headers.findIndex((h: string) => h === name);
          return found !== -1 ? found : fallback;
        };

        const idxCode = getColIdx('codigo_unico', 0);
        const idxPpu = getColIdx('ppu', 1);
        const idxMarca = getColIdx('marca', 2);
        const idxModelo = getColIdx('modelo', 3);
        const idxAnio = getColIdx('anio', 4);
        const idxTipo = getColIdx('tipo', 5);
        const idxGps = getColIdx('gps_proveedor', 6);
        const idxFuel = getColIdx('tarjeta_combustible', 7);
        const idxTag = getColIdx('numero_tag', 8);
        const idxKm = getColIdx('kilometraje', 9);
        const idxContrato = getColIdx('contrato', 10);
        const idxProveedor = getColIdx('proveedor', 11);

        const newLoadedVehicles: Vehicle[] = [];
        let errorsCount = 0;
        const parseLogs: string[] = [];

        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i];
          if (!cols || cols.length === 0) continue;

          // Skip empty spacing rows
          const hasData = cols.some((c: any) => c !== undefined && c !== null && String(c).trim() !== '');
          if (!hasData) continue;

          const rawCode = cols[idxCode] !== undefined && cols[idxCode] !== null ? String(cols[idxCode]).trim() : `FL-${Math.floor(Math.random() * 900 + 100)}`;
          const rawPpu = cols[idxPpu] !== undefined && cols[idxPpu] !== null ? String(cols[idxPpu]).trim() : '';

          if (!rawPpu) {
            errorsCount++;
            parseLogs.push(`Fila ${i + 1}: Omitida, patente (PPU) en blanco.`);
            continue;
          }

          // PPU Sanitization: NO spaces or hyphens as requested!
          const cleanPpu = rawPpu.replace(/[\s-]/g, '').toUpperCase();

          // Check for duplication in existing state or current chunk
          if (vehicles.some(v => v.ppu === cleanPpu) || newLoadedVehicles.some(v => v.ppu === cleanPpu)) {
            errorsCount++;
            parseLogs.push(`Fila ${i + 1}: Omitida, Patente ${cleanPpu} ya existente en BD del sistema.`);
            continue;
          }

          const rawBrand = cols[idxMarca] !== undefined && cols[idxMarca] !== null ? String(cols[idxMarca]).trim() : 'Generica';
          const rawModel = cols[idxModelo] !== undefined && cols[idxModelo] !== null ? String(cols[idxModelo]).trim() : 'Modelo';
          const rawAnio = Number(cols[idxAnio]) || 2022;
          const rawTipo = cols[idxTipo] !== undefined && cols[idxTipo] !== null ? String(cols[idxTipo]).trim() : 'Vehiculo de Apoyo a la Operacion';
          const rawGps = cols[idxGps] !== undefined && cols[idxGps] !== null ? String(cols[idxGps]).trim() : 'BlackGPS';
          const rawFuel = cols[idxFuel] !== undefined && cols[idxFuel] !== null ? String(cols[idxFuel]).trim() : 'Copec';
          const rawTag = cols[idxTag] !== undefined && cols[idxTag] !== null ? String(cols[idxTag]).trim() : `TAG-${Math.floor(Math.random() * 900000 + 100000)}`;
          const rawKm = Number(cols[idxKm]) || 0;
          const rawContrato = cols[idxContrato] !== undefined && cols[idxContrato] !== null ? String(cols[idxContrato]).trim().toUpperCase() : 'AVO';
          const rawProveedor = cols[idxProveedor] !== undefined && cols[idxProveedor] !== null ? String(cols[idxProveedor]).trim() : 'SALFA';

          // Center of Cost lookup
          const cc = CONTRATO_CENTRO_COSTO[rawContrato] || 1800;

          const parsedVehicle: Vehicle = {
            codigo_unico: rawCode,
            ppu: cleanPpu,
            marca: rawBrand,
            modelo: rawModel,
            anio: rawAnio,
            tipo: rawTipo,
            gps_proveedor: rawGps as any,
            tarjeta_combustible: rawFuel as any,
            numero_tag: rawTag,
            kilometraje: rawKm,
            contrato: rawContrato,
            centro_costo: cc,
            proveedor: rawProveedor as any,
            estado: 'Operativo',
            documentos: {
              permiso_circulacion: { fecha_vencimiento: '2027-03-31', cargado: false },
              soap: { fecha_vencimiento: '2027-03-31', cargado: false },
              revision_tecnica: { fecha_vencimiento: '2026-10-15', cargado: false },
              emision_gases: { fecha_vencimiento: '2026-10-15', cargado: false }
            },
            coords: { lat: -33.456 + (Math.random() - 0.5) * 0.1, lng: -70.648 + (Math.random() - 0.5) * 0.1 },
            velocidad: 0
          };

          newLoadedVehicles.push(parsedVehicle);
        }

        if (newLoadedVehicles.length > 0) {
          onUpdateVehicles([...vehicles, ...newLoadedVehicles]);
          setUploadSuccess(`Carga Masiva Exitosa: Se incorporaron ${newLoadedVehicles.length} vehículos nuevos desde la planilla Excel. ${errorsCount > 0 ? `Se ignoraron ${errorsCount} filas con inconsistencias.` : ''}`);
          setUploadError(parseLogs.length > 0 ? parseLogs.join(' | ') : null);
        } else {
          setUploadError(`No se importaron registros de la planilla. Detalles: ${parseLogs.join(' | ') || 'Celdas vacías o incorrectas'}`);
          setUploadSuccess(null);
        }
      } catch (err: any) {
        setUploadError(`Error de lectura en archivo Excel: ${err.message}`);
        setUploadSuccess(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Filter local inventory
  const filteredVehiclesList = vehicles.filter(v => {
    return (
      v.ppu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.codigo_unico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.contrato.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6" id="vehicle-inventory-view">
      
      {/* Hidden file input for document handling */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUploaded}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        className="hidden"
        id="hidden-document-fileupload"
      />

      {/* Overview Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="action-bar-container">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por patente, código, tipo, contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            id="inventory-primary-search"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2" id="inventory-toolbar-actions">
          {/* Audit downloads (PDF/EXCEL) */}
          {permissions.descargar_auditoria ? (
            <>
              <button
                onClick={() => exportToExcel(vehicles)}
                className="bg-white hover:bg-slate-50 text-slate-700 text-xs py-2 px-3.5 rounded-xl border border-slate-200 font-medium inline-flex items-center gap-1.5 transition-all"
                title="Descargar Planilla compatible con Excel"
                id="btn-export-excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Descargar Excel
              </button>

              <button
                onClick={() => triggerPDFPrint(vehicles)}
                className="bg-white hover:bg-slate-50 text-slate-700 text-xs py-2 px-3.5 rounded-xl border border-slate-200 font-medium inline-flex items-center gap-1.5 transition-all"
                title="Generar PDF Oficial para Auditoría Interna"
                id="btn-export-pdf"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                Auditoría PDF
              </button>
            </>
          ) : (
            <span className="text-[11px] text-slate-400 border border-slate-100 bg-slate-50 px-3 py-2 rounded-xl italic">
              Descarga limitada por permisos
            </span>
          )}

          {permissions.editar_flota && (
            <button
              onClick={() => {
                resetForm();
                setIsAdding(!isAdding);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-4 rounded-xl font-medium inline-flex items-center gap-1.5 transition-all shadow-md shadow-indigo-100"
              id="btn-trigger-add-vehicle"
            >
              <Plus className="w-4 h-4" />
              {isAdding ? 'Cerrar Panel' : 'Nuevo Vehículo'}
            </button>
          )}
        </div>
      </div>

      {/* Massive CSV Excel Upload Area (drag & drop simulated dashboard) */}
      {permissions.carga_masiva && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center" id="drag-drop-loader-panel">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-white rounded-xl shadow-xs text-indigo-600">
                <Table className="w-6 h-6" />
              </div>
            </div>
            
            <h4 className="font-bold text-slate-900 text-sm">Carga Masiva de Vehículos Logísticos</h4>
            <p className="text-xs text-slate-500 mt-1">
              Suba una planilla Excel (.xlsx o .xls) conteniendo el inventario masivo. El sistema auto-asociará cada contrato con su Centro de Costo respectivo de manera automatizada.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
              <label className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all inline-flex items-center justify-center gap-1.5 shadow-xs">
                <Upload className="w-4 h-4 text-indigo-600" />
                Examinar Planilla Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleMassiveExcelUploaded}
                />
              </label>

              <button
                onClick={() => {
                  // Download Excel import template
                  const headers = [
                    'codigo_unico', 'ppu', 'marca', 'modelo', 'anio', 'tipo', 'gps_proveedor', 'tarjeta_combustible', 'numero_tag', 'kilometraje', 'contrato', 'proveedor'
                  ];
                  const data = [
                    headers,
                    ['FL-701', 'PPDX99', 'Ford', 'Transit Cargo', 2024, 'Grua Liviana', 'BlackGPS', 'Copec', 'TAG-12345', 12500, 'AVO', 'SALFA'],
                    ['FL-702', 'KKWW88', 'Chevrolet', 'D-Max', 2022, 'Patrulla', 'Webfleet', 'Shell', 'TAG-44332', 68100, 'ISA MAIPO', 'GAMMA']
                  ];
                  const worksheet = XLSX.utils.aoa_to_sheet(data);
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, 'Flota');
                  XLSX.writeFile(workbook, 'plantilla_carga_masiva.xlsx');
                }}
                className="bg-transparent hover:bg-slate-200/50 text-slate-600 px-4 py-2 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1.5 border border-slate-200/50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Plantilla Excel
              </button>
            </div>

            {uploadSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs text-left flex gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadSuccess}</span>
              </div>
            )}
            {uploadError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs text-left flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-mono break-all text-[11px]">{uploadError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Creation/Editing Form */}
      {isAdding && permissions.editar_flota && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left max-w-4xl mx-auto block space-y-6 animate-fade-in" id="add-vehicle-form">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            {editingVehicle ? '✏️ Editar Datos de Vehículo' : '➕ Registrar Nuevo Vehículo de Flota'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Required Primary Columns */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Código Único (Fijo)</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                placeholder="Ej. FL-101"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">PPU (Patente)*</label>
              <input
                type="text"
                required
                value={ppu}
                onChange={(e) => setPpu(e.target.value.replace(/[\s-]/g, '').toUpperCase())}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                placeholder="Ej. RJGY88 (Sin guión)"
              />
              <span className="text-[10px] text-slate-400">Sin guiones ni espacios</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Marca*</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                placeholder="Ej. Ford"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Modelo*</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                placeholder="Ej. F-550"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Año*</label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Custom categories selection mapping */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Vehículo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Proveedor GPS</label>
              <select
                value={gps}
                onChange={(e) => setGps(e.target.value as ProveedorGPS)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="BlackGPS">BlackGPS</option>
                <option value="Maxtracker">Maxtracker</option>
                <option value="Webfleet">Webfleet</option>
                <option value="Sin GPS">Sin GPS</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tarjeta Combustible</label>
              <select
                value={fuelCard}
                onChange={(e) => setFuelCard(e.target.value as ProveedorCombustible)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Copec">Copec</option>
                <option value="Shell">Shell</option>
                <option value="Sin Tarjeta">Sin Tarjeta</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Número de TAG</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                placeholder="Fórmula de TAG"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Kilometraje (Odómetro)</label>
              <input
                type="number"
                required
                value={odometer}
                onChange={(e) => setOdometer(Number(e.target.value))}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Contrato</label>
              <select
                value={contract}
                onChange={(e) => setContract(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
              >
                {Object.keys(CONTRATO_CENTRO_COSTO).map(contractKey => (
                  <option key={contractKey} value={contractKey}>
                    {contractKey} (CC {CONTRATO_CENTRO_COSTO[contractKey]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Proveedor Leasing</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ProveedorLeasing)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="SALFA">SALFA</option>
                <option value="GAMMA">GAMMA</option>
                <option value="ECONORENT">ECONORENT</option>
                <option value="NERA">NERA</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Operador / Chofer</label>
              <input
                type="text"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                placeholder="Nombre del Chofer"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Estado de Operación</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Operativo">Operativo</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Siniestrado">Siniestrado</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Vencimiento de Documentación Obligatoria (Chilena) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200" id="docs-vencimientos-form-group">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Vencimientos Documentación de Control Vial</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">Permiso Circulación</label>
                <input
                  type="date"
                  value={circulacionDate}
                  onChange={(e) => setCirculacionDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">SOAP</label>
                <input
                  type="date"
                  value={soapDate}
                  onChange={(e) => setSoapDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">Revisión Técnica</label>
                <input
                  type="date"
                  value={rtDate}
                  onChange={(e) => setRtDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">Emisión de Gases</label>
                <input
                  type="date"
                  value={gasesDate}
                  onChange={(e) => setGasesDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAdding(false);
              }}
              className="px-4 py-2 text-xs border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md"
            >
              {editingVehicle ? 'Guardar Cambios' : 'Ingresar Vehículo'}
            </button>
          </div>
        </form>
      )}

      {/* Admin Quick category creator */}
      {permissions.editar_flota && !isAdding && (
        <div className="bg-white p-4 rounded-xl border border-slate-100 text-left max-w-sm" id="custom-cat-creator">
          <h5 className="text-xs font-bold text-slate-800 mb-2">Añadir Categoría de Vehículo</h5>
          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="Nueva Categoría..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="text-xs p-2 border border-slate-200 rounded-lg flex-1 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
            >
              Crear
            </button>
          </form>
        </div>
      )}

      {/* Database Inventory Table Ledger */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="inventory-table-ledger">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-left">Código</th>
                <th className="py-3 px-4 text-left">Patente (PPU)</th>
                <th className="py-3 px-4 text-left">Marca - Modelo (Año)</th>
                <th className="py-3 px-4 text-left">Tipo</th>
                <th className="py-3 px-4 text-left">Contrato / CC</th>
                <th className="py-3 px-4 text-right">Odómetro</th>
                <th className="py-3 px-4 text-center">GPS</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Carpeta Documental Digital</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-left" id="inventory-tbody">
              {filteredVehiclesList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    No se encontraron vehículos disponibles en el inventario.
                  </td>
                </tr>
              ) : (
                filteredVehiclesList.map(v => {
                  return (
                    <tr
                      key={v.codigo_unico}
                      className="hover:bg-slate-50/50 transition-colors"
                      id={`row-${v.codigo_unico}`}
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {v.codigo_unico}
                      </td>

                      {/* Plate */}
                      <td className="py-3 px-4">
                        <span className="font-mono bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-250">
                          {v.ppu}
                        </span>
                      </td>

                      {/* Car Details */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">{v.marca} {v.modelo}</span>
                        <span className="text-slate-400 text-[10px] ml-1">({v.anio})</span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {v.tipo}
                      </td>

                      {/* Contract */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{v.contrato}</div>
                        <div className="text-[10px] text-indigo-600 font-mono">CC {v.centro_costo}</div>
                      </td>

                      {/* Mileage */}
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {v.kilometraje.toLocaleString()} km
                      </td>

                      {/* GPS Provider */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 italic">
                          {v.gps_proveedor}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          v.estado === 'Operativo' ? 'bg-emerald-50 text-emerald-700' :
                          v.estado === 'Mantenimiento' ? 'bg-amber-50 text-amber-700' :
                          v.estado === 'Siniestrado' ? 'bg-rose-50 text-rose-700 animate-pulse' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {v.estado}
                        </span>
                      </td>

                      {/* Control Documental Files list with dynamic states */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2" id={`docs-{v.ppu}`}>
                          
                          {/* Permiso */}
                          <div className="text-center group relative">
                            <button
                              onClick={() => v.documentos.permiso_circulacion.cargado ? downloadDocument(v, 'permiso_circulacion') : triggerDocUpload(v.ppu, 'permiso_circulacion')}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center border font-semibold ${
                                v.documentos.permiso_circulacion.cargado 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={`Permiso de Circulación: ${v.documentos.permiso_circulacion.fecha_vencimiento} (${v.documentos.permiso_circulacion.cargado ? 'Cargado - Click para descargar' : 'Pendiente - Click para subir'})`}
                            >
                              PC
                            </button>
                            {/* tooltip */}
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[9px] rounded opacity-0 pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap">
                              Vence: {v.documentos.permiso_circulacion.fecha_vencimiento}
                            </span>
                          </div>

                          {/* SOAP */}
                          <div className="text-center group relative">
                            <button
                              onClick={() => v.documentos.soap.cargado ? downloadDocument(v, 'soap') : triggerDocUpload(v.ppu, 'soap')}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center border font-semibold ${
                                v.documentos.soap.cargado 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={`SOAP: ${v.documentos.soap.fecha_vencimiento} (${v.documentos.soap.cargado ? 'Cargado - Click para descargar' : 'Pendiente - Click para subir'})`}
                            >
                              SP
                            </button>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[9px] rounded opacity-0 pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap">
                              Vence: {v.documentos.soap.fecha_vencimiento}
                            </span>
                          </div>

                          {/* Revisión Técnica */}
                          <div className="text-center group relative">
                            <button
                              onClick={() => v.documentos.revision_tecnica.cargado ? downloadDocument(v, 'revision_tecnica') : triggerDocUpload(v.ppu, 'revision_tecnica')}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center border font-semibold ${
                                v.documentos.revision_tecnica.cargado 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={`Revisión Técnica: ${v.documentos.revision_tecnica.fecha_vencimiento} (${v.documentos.revision_tecnica.cargado ? 'Cargado - Click para descargar' : 'Pendiente - Click para subir'})`}
                            >
                              RT
                            </button>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[9px] rounded opacity-0 pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap">
                              Vence: {v.documentos.revision_tecnica.fecha_vencimiento}
                            </span>
                          </div>

                          {/* Gases */}
                          <div className="text-center group relative">
                            <button
                              onClick={() => v.documentos.emision_gases.cargado ? downloadDocument(v, 'emision_gases') : triggerDocUpload(v.ppu, 'emision_gases')}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center border font-semibold ${
                                v.documentos.emision_gases.cargado 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={`Gases: ${v.documentos.emision_gases.fecha_vencimiento} (${v.documentos.emision_gases.cargado ? 'Cargado - Click para descargar' : 'Pendiente - Click para subir'})`}
                            >
                              GS
                            </button>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[9px] rounded opacity-0 pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap">
                              Vence: {v.documentos.emision_gases.fecha_vencimiento}
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" id={`actions-${v.ppu}`}>
                          <button
                            onClick={() => handleEdit(v)}
                            disabled={!permissions.editar_flota}
                            className={`p-1.5 rounded-lg border transition-all ${
                              permissions.editar_flota 
                                ? 'border-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50' 
                                : 'opacity-30 cursor-not-allowed'
                            }`}
                            title="Editar Datos"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(v.ppu)}
                            disabled={!permissions.editar_flota}
                            className={`p-1.5 rounded-lg border transition-all ${
                              permissions.editar_flota 
                                ? 'border-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50' 
                                : 'opacity-30 cursor-not-allowed'
                            }`}
                            title="Eliminar del Sistema"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
