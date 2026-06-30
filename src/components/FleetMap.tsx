import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { Map, Navigation, Shield, Radio, Layers, Search, Bell, Activity } from 'lucide-react';

interface FleetMapProps {
  vehicles: Vehicle[];
  onSelectVehicle: (v: Vehicle) => void;
  selectedVehicle: Vehicle | null;
}

export default function FleetMap({ vehicles, onSelectVehicle, selectedVehicle }: FleetMapProps) {
  const [activeGPSFilter, setActiveGPSFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [simulatedTime, setSimulatedTime] = useState<string>('');
  const [mockSpeedBoost, setMockSpeedBoost] = useState<number>(0);

  // Live simulation of GPS pings
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSimulatedTime(now.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter vehicles based on search and GPS provider
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.ppu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.codigo_unico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.contrato.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeGPSFilter === 'Todos') return matchesSearch;
    return matchesSearch && v.gps_proveedor === activeGPSFilter;
  });

  // Calculate coordinates bounds to draw within our SVG Map box gracefully
  // Santiago base is lat: -33.45, lng: -70.66
  // We'll map them relative to a 100% canvas size
  const getMapCoords = (lat: number, lng: number) => {
    // Normalizing coordinates around Santiago/Metropolitan region
    // Lat range: -34.2 to -33.3
    // Lng range: -71.3 to -70.4
    const latMin = -34.25;
    const latMax = -33.30;
    const lngMin = -71.30;
    const lngMax = -70.45;

    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    // Map is inverted since screen Y goes downwards
    const y = 100 - (((lat - latMin) / (latMax - latMin)) * 100);

    // Keep within safe SVG boundaries
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(10, Math.min(90, y))
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="fleet-live-map-grid">
      {/* Sidebar: Vehicles List & GPS Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col h-[580px]" id="map-control-sidebar">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h3 className="font-semibold text-slate-900 text-sm tracking-tight">Telemetría Satelital</h3>
          </div>
          <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
            LIVE {simulatedTime}
          </span>
        </div>

        {/* GPS Integrations Selector */}
        <div className="mb-4">
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2 block">
            Proveedor GPS Centralizado
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 rounded-xl" id="gps-vendors-filters">
            {['Todos', 'BlackGPS', 'Maxtracker', 'Webfleet'].map(prov => (
              <button
                key={prov}
                onClick={() => setActiveGPSFilter(prov)}
                className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                  activeGPSFilter === prov
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                id={`btn-gps-filter-${prov.toLowerCase().replace(' ', '-')}`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar PPU, código, contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            id="map-vehicle-search"
          />
        </div>

        {/* Vehicles list */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar" id="map-vehicles-scroll">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No se encontraron vehículos activos con estos filtros.
            </div>
          ) : (
            filteredVehicles.map(v => {
              const isSelected = selectedVehicle?.codigo_unico === v.codigo_unico;
              return (
                <div
                  key={v.codigo_unico}
                  onClick={() => onSelectVehicle(v)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-100 hover:border-slate-300 bg-slate-50/20'
                  }`}
                  id={`vehicle-card-${v.codigo_unico}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {v.ppu}
                      </span>
                      <h4 className="font-semibold text-xs text-slate-900 mt-1">
                        {v.codigo_unico} • {v.marca} {v.modelo}
                      </h4>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${
                      v.estado === 'Operativo' ? 'bg-emerald-500' : v.estado === 'Mantenimiento' ? 'bg-amber-400' : 'bg-rose-500'
                    }`} title={v.estado} />
                  </div>

                  <div className="flex justify-between items-center mt-2.5 text-[10px] text-slate-500">
                    <span>Contrato: <strong className="text-slate-700">{v.contrato}</strong></span>
                    <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-600">
                      CC {v.centro_costo}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-slate-500" style={{ transform: `rotate(${Math.floor(v.coords.lat * 100) % 360}deg)` }} />
                      {v.velocidad > 0 ? `${v.velocidad} km/h` : 'Detenido'}
                    </span>
                    <span className="text-slate-500 italic">{v.gps_proveedor}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Map Visual Canvas */}
      <div className="lg:col-span-3 bg-slate-900 rounded-2xl relative border border-slate-800 shadow-md flex flex-col h-[580px] overflow-hidden" id="main-map-canvas-container">
        {/* Top telemetry control panel */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-2 justify-between items-center pointer-events-none">
          <div className="bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-3 pointer-events-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-medium">CONEXIÓN SATELITAL CENTRAL</div>
              <div className="text-xs font-mono font-bold text-white">Consola Centralizada GPS</div>
            </div>
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => {
                // Boost speed simulation
                alert('Iniciando simulación de ruta acelerada. Las coordenadas GPS recibirán actualizaciones en tiempo real.');
              }}
              className="bg-slate-950/90 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-indigo-400 font-medium flex items-center gap-1.5 transition-all"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Simular Movimiento
            </button>
          </div>
        </div>

        {/* Map SVG Render representation */}
        <div className="flex-1 w-full bg-slate-950 relative flex items-center justify-center p-4">
          {/* Simulated Satellite Overlay Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
          
          <svg className="absolute inset-0 w-full h-full text-slate-800/20" xmlns="http://www.w3.org/2000/svg">
            {/* Draw Roads/Highways representing central Chile highways */}
            {/* Autopista Costanera Norte */}
            <path d="M -50 200 C 200 150, 400 350, 900 250" fill="none" stroke="#334155" strokeWidth="6" opacity="0.6" strokeDasharray="5,5" />
            <path d="M -50 200 C 200 150, 400 350, 900 250" fill="none" stroke="#64748b" strokeWidth="2" opacity="0.8" />
            
            {/* Américo Vespucio Ring highway */}
            <ellipse cx="400" cy="280" rx="320" ry="190" fill="none" stroke="#1e293b" strokeWidth="8" opacity="0.7" />
            <ellipse cx="400" cy="280" rx="320" ry="190" fill="none" stroke="#334155" strokeWidth="2.5" opacity="0.9" strokeDasharray="8,4" />

            {/* Ruta 5 Autopista Central (Vertical) */}
            <path d="M 450 -50 C 450 150, 430 350, 440 650" fill="none" stroke="#334155" strokeWidth="6" opacity="0.6" />
            <path d="M 450 -50 C 450 150, 430 350, 440 650" fill="none" stroke="#475569" strokeWidth="2" opacity="0.80" />

            {/* Labels of sectors on the Map */}
            <text x="70%" y="20%" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="monospace">VITACURA / AVO</text>
            <text x="15%" y="45%" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="monospace">PUDAHUEL / RUTA 68</text>
            <text x="48%" y="95%" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="monospace">RUTA 5 SUR / MAIPO</text>
            <text x="44%" y="40%" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="monospace">SANTIAGO CENTRO</text>
            <text x="12%" y="82%" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="monospace">RUTA DE LA FRUTA</text>
          </svg>

          {/* Render Vehicles on CSS Map Coordinates */}
          {filteredVehicles.map(v => {
            const { x, y } = getMapCoords(v.coords.lat, v.coords.lng);
            const isSelected = selectedVehicle?.codigo_unico === v.codigo_unico;

            return (
              <div
                key={v.codigo_unico}
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => onSelectVehicle(v)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                id={`map-pin-${v.codigo_unico}`}
              >
                {/* Ping wave effect for moving/active cars */}
                {v.velocidad > 0 && (
                  <span className={`absolute -inset-2.5 rounded-full animate-ping opacity-25 ${
                    v.estado === 'Operativo' ? 'bg-emerald-400' : v.estado === 'Mantenimiento' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                )}

                {/* Pin Head */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isSelected 
                    ? 'scale-125 bg-indigo-600 border-white ring-4 ring-indigo-500/30' 
                    : 'bg-slate-900 border-slate-700 hover:scale-110 group-hover:border-slate-100'
                }`}>
                  <Navigation 
                    className={`w-4 h-4 ${
                      isSelected ? 'text-white' : v.estado === 'Operativo' ? 'text-emerald-400' : v.estado === 'Mantenimiento' ? 'text-amber-400' : 'text-rose-500'
                    }`}
                    style={{ transform: `rotate(${Math.floor(v.coords.lat * 500) % 360}deg)` }}
                  />
                </div>

                {/* Pin plate tag (Visible on hover or when selected) */}
                <div className={`absolute bottom-9 left-1/2 transform -translate-x-1/2 bg-slate-950 text-white text-[10px] font-mono px-2 py-1 rounded-md border border-slate-800 transition-all ${
                  isSelected ? 'opacity-100 scale-100 translate-y-0 shadow-lg' : 'opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 pointer-events-none'
                } whitespace-nowrap z-50`}>
                  <div className="font-bold text-center text-slate-200">{v.codigo_unico}</div>
                  <div className="text-[9px] text-indigo-300 font-sans">{v.ppu} • {v.contrato}</div>
                  {v.velocidad > 0 && <div className="text-[8px] text-emerald-400">{v.velocidad} KM/H</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Vehicle Info Overlay (At the bottom of the map) */}
        {selectedVehicle && (
          <div className="bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 shrink-0 transition-all z-30" id="selected-vehicle-map-footer">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                  <Map className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-800 text-slate-200 px-2 py-0.5 rounded-sm font-mono font-bold tracking-wider">
                      {selectedVehicle.ppu}
                    </span>
                    <span className="text-xs text-slate-400">({selectedVehicle.codigo_unico})</span>
                    <span className={`w-2 h-2 rounded-full ${selectedVehicle.estado === 'Operativo' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <h4 className="font-bold text-sm text-white mt-1">
                    {selectedVehicle.marca} {selectedVehicle.modelo} • {selectedVehicle.tipo}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Conductor asignado: <span className="text-slate-200">{selectedVehicle.chofer || 'Por asignar'}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-t border-slate-800 md:border-t-0 pt-3 md:pt-0">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Proveedor GPS</div>
                  <div className="text-xs text-slate-200 font-medium">{selectedVehicle.gps_proveedor}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Odómetro</div>
                  <div className="text-xs text-slate-200 font-mono">{selectedVehicle.kilometraje.toLocaleString()} KM</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Contrato (CC)</div>
                  <div className="text-xs text-slate-200 font-medium">
                    {selectedVehicle.contrato} ({selectedVehicle.centro_costo})
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Ubicación GPS</div>
                  <div className="text-[10px] text-indigo-400 font-mono">
                    {selectedVehicle.coords.lat.toFixed(4)}, {selectedVehicle.coords.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
