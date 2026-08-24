/**
 * firestore.ts
 * Helpers tipados para operaciones CRUD sobre cada colección de Firestore.
 * Toda la lógica de Firestore queda encapsulada aquí para mantener los componentes limpios.
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type QuerySnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Vehicle,
  MaintenanceLog,
  FleetMovementLog,
  Incident,
  UserRole,
  SupervisorFleetLog,
  WorkshopLog,
} from '../types';

// ─── Nombres de colecciones ────────────────────────────────────────────────────
export const COLLECTIONS = {
  VEHICLES: 'vehicles',
  MAINTENANCE: 'maintenanceLogs',
  MOVEMENTS: 'movementLogs',
  INCIDENTS: 'incidents',
  USERS: 'users',
  SUPERVISOR_LOGS: 'supervisorLogs',
  WORKSHOP_LOGS: 'workshopLogs',
} as const;

// ─── Helper genérico ────────────────────────────────────────────────────────────
/**
 * Suscribe a una colección en tiempo real.
 * Retorna la función de unsubscribe para limpiar en useEffect.
 */
export async function getCollectionOnce<T>(collectionName: string): Promise<T[]> {
  try {
    const snap = await getDocs(query(collection(db, collectionName)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
  } catch (error: any) {
    console.error(`Error al obtener colección '${collectionName}':`, error.code, error.message);
    return [];
  }
}

export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const q = query(collection(db, collectionName));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
      callback(data);
    },
    (error) => {
      console.warn(`[Firestore] Suscripción '${collectionName}':`, error.code, error.message);
      if (onError) onError(error);
    }
  );
}


// Helper para realizar llamadas de escritura al API Serverless
async function callWriteApi(action: 'add' | 'update' | 'delete', collection: string, id?: string, data?: any): Promise<any> {
  const res = await fetch('/api/write-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, collection, id, data })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'HTTP error ' + res.status);
  }
  return res.json();
}

// ─── VEHICLES ──────────────────────────────────────────────────────────────────
export function subscribeToVehicles(cb: (v: Vehicle[]) => void, onError?: (err: any) => void): Unsubscribe {
  return subscribeToCollection<Vehicle>(COLLECTIONS.VEHICLES, cb, onError);
}

export async function addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<string> {
  const res = await callWriteApi('add', COLLECTIONS.VEHICLES, undefined, vehicle);
  return res.id;
}

export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<void> {
  await callWriteApi('update', COLLECTIONS.VEHICLES, id, data);
}

export async function deleteVehicle(id: string): Promise<void> {
  await callWriteApi('delete', COLLECTIONS.VEHICLES, id);
}

// ─── MAINTENANCE LOGS ──────────────────────────────────────────────────────────
export function subscribeToMaintenance(cb: (logs: MaintenanceLog[]) => void, onError?: (err: any) => void): Unsubscribe {
  return subscribeToCollection<MaintenanceLog>(COLLECTIONS.MAINTENANCE, cb, onError);
}

export async function addMaintenanceLog(log: Omit<MaintenanceLog, 'id'>): Promise<string> {
  const res = await callWriteApi('add', COLLECTIONS.MAINTENANCE, undefined, log);
  return res.id;
}

export async function updateMaintenanceLog(id: string, data: Partial<MaintenanceLog>): Promise<void> {
  await callWriteApi('update', COLLECTIONS.MAINTENANCE, id, data);
}

export async function deleteMaintenanceLog(id: string): Promise<void> {
  await callWriteApi('delete', COLLECTIONS.MAINTENANCE, id);
}

// ─── MOVEMENT LOGS ─────────────────────────────────────────────────────────────
export function subscribeToMovements(cb: (logs: FleetMovementLog[]) => void, onError?: (err: any) => void): Unsubscribe {
  return subscribeToCollection<FleetMovementLog>(COLLECTIONS.MOVEMENTS, cb, onError);
}

export async function addMovementLog(log: Omit<FleetMovementLog, 'id'>): Promise<string> {
  const res = await callWriteApi('add', COLLECTIONS.MOVEMENTS, undefined, log);
  return res.id;
}

export async function updateMovementLog(id: string, data: Partial<FleetMovementLog>): Promise<void> {
  await callWriteApi('update', COLLECTIONS.MOVEMENTS, id, data);
}

// ─── INCIDENTS ─────────────────────────────────────────────────────────────────
export function subscribeToIncidents(cb: (incidents: Incident[]) => void, onError?: (err: any) => void): Unsubscribe {
  return subscribeToCollection<Incident>(COLLECTIONS.INCIDENTS, cb, onError);
}

export async function addIncident(incident: Omit<Incident, 'id'>): Promise<string> {
  const res = await callWriteApi('add', COLLECTIONS.INCIDENTS, undefined, incident);
  return res.id;
}

export async function updateIncident(id: string, data: Partial<Incident>): Promise<void> {
  await callWriteApi('update', COLLECTIONS.INCIDENTS, id, data);
}

// ─── USERS ─────────────────────────────────────────────────────────────────────
export function subscribeToUsers(cb: (users: UserRole[]) => void, onError?: (err: any) => void): Unsubscribe {
  return subscribeToCollection<UserRole>(COLLECTIONS.USERS, cb, onError);
}

export async function addUser(user: Omit<UserRole, 'id'>): Promise<string> {
  const res = await callWriteApi('add', COLLECTIONS.USERS, undefined, user);
  return res.id;
}

export async function updateUser(id: string, data: Partial<UserRole>): Promise<void> {
  await callWriteApi('update', COLLECTIONS.USERS, id, data);
}

export async function deleteUser(id: string): Promise<void> {
  await callWriteApi('delete', COLLECTIONS.USERS, id);
}

// ─── SUPERVISOR LOGS ───────────────────────────────────────────────────────────
export function subscribeToSupervisorLogs(cb: (logs: SupervisorFleetLog[]) => void, onError?: (err: any) => void): Unsubscribe {
  return subscribeToCollection<SupervisorFleetLog>(COLLECTIONS.SUPERVISOR_LOGS, cb, onError);
}

export async function addSupervisorLog(log: Omit<SupervisorFleetLog, 'id'>): Promise<string> {
  const res = await callWriteApi('add', COLLECTIONS.SUPERVISOR_LOGS, undefined, log);
  return res.id;
}

export async function updateSupervisorLog(id: string, data: Partial<SupervisorFleetLog>): Promise<void> {
  await callWriteApi('update', COLLECTIONS.SUPERVISOR_LOGS, id, data);
}

// ─── WORKSHOP LOGS ─────────────────────────────────────────────────────────────
export function subscribeToWorkshopLogs(cb: (logs: WorkshopLog[]) => void, onError?: (err: any) => void): Unsubscribe {
  return subscribeToCollection<WorkshopLog>(COLLECTIONS.WORKSHOP_LOGS, cb, onError);
}

export async function addWorkshopLog(log: Omit<WorkshopLog, 'id'>): Promise<string> {
  const res = await callWriteApi('add', COLLECTIONS.WORKSHOP_LOGS, undefined, log);
  return res.id;
}

export async function updateWorkshopLog(id: string, data: Partial<WorkshopLog>): Promise<void> {
  await callWriteApi('update', COLLECTIONS.WORKSHOP_LOGS, id, data);
}

export async function deleteMovementLog(id: string): Promise<void> {
  await callWriteApi('delete', COLLECTIONS.MOVEMENTS, id);
}

export async function deleteIncident(id: string): Promise<void> {
  await callWriteApi('delete', COLLECTIONS.INCIDENTS, id);
}

export async function deleteSupervisorLog(id: string): Promise<void> {
  await callWriteApi('delete', COLLECTIONS.SUPERVISOR_LOGS, id);
}

export async function deleteWorkshopLog(id: string): Promise<void> {
  await callWriteApi('delete', COLLECTIONS.WORKSHOP_LOGS, id);
}

