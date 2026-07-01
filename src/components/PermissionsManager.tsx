import React, { useState } from 'react';
import { UserRole, UserPermissions } from '../types';
import { UserPlus, Shield, ShieldCheck, Mail, Lock, Unlock, CheckSquare, Square, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { auth } from '../lib/firebase';

interface PermissionsManagerProps {
  users: UserRole[];
  onUpdateUsers: (newUsers: UserRole[]) => void;
  currentUserRole: UserRole;
  onSelectActiveSimulatedUser: (user: UserRole) => void;
}

export default function PermissionsManager({
  users,
  onUpdateUsers,
  currentUserRole,
  onSelectActiveSimulatedUser
}: PermissionsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form states to create new user
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleGroup, setRoleGroup] = useState<'Administrador' | 'Gestor' | 'Operador'>('Operador');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserRole.permisos.gestionar_usuarios) {
      alert('Su cuenta actual no cuenta con autorización para crear otros usuarios.');
      return;
    }

    if (!name || !email || !password) {
      alert('Por favor llene todos los campos requeridos.');
      return;
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Obtener Token de ID del usuario actual de Firebase Auth
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        throw new Error('No se pudo verificar la sesión del administrador actual. Por favor recarga e inicia sesión nuevamente.');
      }

      // 2. Llamar a la API serverless de Vercel
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: roleGroup
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'firebase-admin-not-configured') {
          alert(
            `⚠️ ERROR DE CONFIGURACIÓN DEL SERVIDOR:\n\n` +
            `El backend de Vercel no tiene configuradas las variables de Cuenta de Servicio.\n\n` +
            `Sigue estos pasos en Vercel:\n` +
            `1. Ve a tu proyecto en Vercel > Settings > Environment Variables.\n` +
            `2. Agrega la variable "FIREBASE_ADMIN_CLIENT_EMAIL" con tu correo de cuenta de servicio.\n` +
            `3. Agrega la variable "FIREBASE_ADMIN_PRIVATE_KEY" con tu clave privada.\n\n` +
            `El perfil de usuario NO ha sido creado en Firebase Authentication.`
          );
          return;
        }
        throw new Error(data.error || 'Error al procesar el registro en el servidor.');
      }

      // 3. Éxito: el backend ya creó el Auth y el documento en Firestore
      alert(`¡Usuario ${name} creado con éxito en el sistema! Ya puede iniciar sesión.`);
      
      setIsAdding(false);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      alert(`Error al crear usuario: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!currentUserRole.permisos.gestionar_usuarios) {
      alert('Su cuenta actual no cuenta con autorización para eliminar otros usuarios.');
      return;
    }

    const confirmDelete = window.confirm(
      `⚠️ ¿Está completamente seguro de que desea eliminar permanentemente al usuario "${userName}"?\n\n` +
      `Esta acción borrará al usuario de Firebase Authentication y de la base de datos de perfiles, impidiendo que vuelva a iniciar sesión. Esto no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        throw new Error('No se pudo verificar la sesión del administrador actual. Por favor recarga e inicia sesión.');
      }

      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: userId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar el usuario en el servidor.');
      }

      alert(`¡El usuario "${userName}" fue eliminado con éxito del sistema!`);
    } catch (err: any) {
      console.error(err);
      alert(`Error al eliminar usuario: ${err.message}`);
    }
  };

  // Toggle single permission instantly with click!
  const handleTogglePermission = (userId: string, key: keyof UserPermissions) => {
    if (!currentUserRole.permisos.gestionar_usuarios) {
      alert('No posee privilegios ejecutivos para alterar la matriz de seguridad de la corporación logístico-comercial.');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const updatedPerms = { ...u.permisos, [key]: !u.permisos[key] };
        return { ...u, permisos: updatedPerms };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    
    // If we altered the currently simulated user, sync state too!
    const updatedTarget = updatedUsers.find(u => u.id === currentUserRole.id);
    if (updatedTarget) {
      onSelectActiveSimulatedUser(updatedTarget);
    }
  };

  const handleToggleUserActive = (userId: string) => {
    if (!currentUserRole.permisos.gestionar_usuarios) {
      alert('No posee privilegios ejecutivos para desactivar cuentas.');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, activo: !u.activo };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);

    // If we altered the currently simulated user, sync state too!
    const updatedTarget = updatedUsers.find(u => u.id === currentUserRole.id);
    if (updatedTarget) {
      onSelectActiveSimulatedUser(updatedTarget);
    }
  };

  // Human names for permissions showing inside the administrator panel matrix
  const permissionLabels: Record<keyof UserPermissions, string> = {
    ver_dashboard: 'Ver Tableros de Control',
    ver_mapas: 'Monitoreo GPS Satelital',
    ver_flota: 'Visualizar Inventario',
    editar_flota: 'Crear / Editar Ficha de Vehículo',
    ver_documentos: 'Consultar Fechas de Vencimiento',
    cargar_documentos: 'Cargar Documentación (Permisos, SOAP)',
    descargar_documentos: 'Descargar Documentación Digital',
    movimientos_flota: 'Loggear Bitácoras de Traspasos',
    incidentes_siniestros: 'Declarar Siniestros Viales',
    mantenimientos: 'Administrar Órdenes de Taller',
    gestionar_usuarios: 'Matriz Cortafuegos (Crear Usuarios)',
    descargar_auditoria: 'Descargar Auditorías Excel / PDF',
    carga_masiva: 'Carga Masiva de Planillas',
    gestion_supervisores: 'Módulo Gestión Supervisores (Terreno)'
  };

  return (
    <div className="space-y-6" id="permissions-manager-root">
      
      {/* User Session Banner Notice */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-700 text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 font-mono">Gestión de Perfiles y Accesos</span>
          </div>
          <h4 className="font-bold text-sm">Administración de Permisos y Roles de Usuario</h4>
          <p className="text-xs text-slate-400">
            Cambie de perfil en la barra superior del sistema o elija una cuenta abajo para pruebas y control de accesos. Los privilegios sobre los paneles, descargas, SOAP y vehículos se aplicarán de inmediato.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block mb-1">Perfil Seleccionado:</span>
          <span className="bg-indigo-600 font-bold px-3 py-1.5 rounded-lg text-xs font-mono text-white inline-block">
            {currentUserRole.nombre} ({currentUserRole.rol})
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Matrix of Users Lists */}
        <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
          <div className="flex items-center justify-between mb-4 border-b border-slate-150 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Matriz de Permisos de Acceso Logístico
            </h3>

            {currentUserRole.permisos.gestionar_usuarios && (
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs py-1.5 px-3 rounded-lg font-semibold flex items-center gap-1 transition-all"
                id="btn-add-operator-account"
              >
                <UserPlus className="w-4 h-4" />
                Crear Operador
              </button>
            )}
          </div>

          {/* User registration form inside Administrator permissions manager */}
          {isAdding && currentUserRole.permisos.gestionar_usuarios && (
            <form onSubmit={handleCreateUser} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 space-y-3">
              <h5 className="font-bold text-xs text-slate-800">Registrar Nuevo Usuario Coordinador</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                    placeholder="Ej. Pedro Picapiedra"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">E-mail Operativo</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                    placeholder="ejemplo@flota.cl"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Contraseña de Acceso</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                    placeholder="Mín. 6 caracteres"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Rol Operativo</label>
                  <select
                    value={roleGroup}
                    onChange={(e) => setRoleGroup(e.target.value as any)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Administrador">Administrador (Control Supremo)</option>
                    <option value="Gestor">Gestor (Monitoreo & Carga)</option>
                    <option value="Operador">Operador de Turno (Bitácoras Básicas)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-550 border border-slate-200 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          )}

          {/* Table display representing instant clicks toggle permission */}
          <div className="space-y-4">
            {users.map(u => {
              const worksAsSimul = u.id === currentUserRole.id;
              return (
                <div key={u.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-200/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-bold text-slate-900 text-sm">{u.nombre}</strong>
                        <span className="text-[9px] bg-slate-250 text-slate-600 px-1.5 py-0.2 rounded font-mono font-bold tracking-wider">
                          {u.id}
                        </span>
                        {worksAsSimul && (
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.2 rounded-full">
                            Cuenta Seleccionada
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{u.email} • Rol: <strong className="text-slate-700">{u.rol}</strong></div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectActiveSimulatedUser(u)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                          worksAsSimul
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                        }`}
                      >
                        Activar este Perfil
                      </button>

                      <button
                        onClick={() => handleToggleUserActive(u.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all ${
                          u.activo 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}
                        title={u.activo ? 'Desactivar esta cuenta' : 'Activar esta cuenta'}
                      >
                        {u.activo ? 'Activo' : 'Suspendido'}
                      </button>

                      {u.email !== auth.currentUser?.email && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.nombre)}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-bold border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Eliminar permanentemente del sistema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Click elements: give or remove privileges instantly as requested! */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Permisos Modulares: Habilite / Deshabilite con 1 click</span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {Object.keys(u.permisos).map(key => {
                        const hasAccess = u.permisos[key as keyof UserPermissions];
                        const permKey = key as keyof UserPermissions;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleTogglePermission(u.id, permKey)}
                            disabled={!currentUserRole.permisos.gestionar_usuarios}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                              hasAccess 
                                ? 'bg-indigo-50 border-indigo-200 text-slate-900' 
                                : 'bg-white border-slate-150 text-slate-400'
                            } ${!currentUserRole.permisos.gestionar_usuarios ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400'}`}
                            title={`Click para ${hasAccess ? 'remover' : 'otorgar'} el acceso`}
                            id={`perm-btn-${u.id}-${key}`}
                          >
                            <span className="shrink-0">
                              {hasAccess ? (
                                <Unlock className="w-3.5 h-3.5 text-indigo-700" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-slate-350" />
                              )}
                            </span>
                            <span className="text-[10px] font-semibold leading-tight break-words">
                              {permissionLabels[permKey]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative column of security status log */}
        <div className="lg:w-80 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 text-left h-fit space-y-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Shield className="w-5 h-5 animate-pulse" />
            <h4 className="font-bold text-sm">Cifrado Logístico Oficial</h4>
          </div>

          <p className="text-xs text-slate-350 leading-relaxed">
            La plataforma utiliza hashing de seguridad operacional local para almacenar los permisos en tiempo real de la flota. Cumple con la normativa ISO 27001 para la protección de accesos limitados.
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
            <h5 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Trazabilidad de Auditorías</h5>
            <div className="space-y-1.5 font-mono text-[9px] text-slate-400">
              <div className="flex justify-between">
                <span>[18:59:02]</span>
                <span className="text-slate-100">Cifrado de PPU Vigente</span>
              </div>
              <div className="flex justify-between">
                <span>[18:59:12]</span>
                <span className="text-slate-100">BOM Excel Inyectado</span>
              </div>
              <div className="flex justify-between">
                <span>[18:59:58]</span>
                <span className="text-emerald-400">DB Sincrona Local OK</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Recuerde que como <strong>Administrador</strong> puede modificar de forma libre el acceso a la bitácora documental de cada vehículo para simular incidentes o auditorías logísticas estrictas.
          </div>
        </div>

      </div>

    </div>
  );
}
