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
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void
): Unsubscribe {
  const q = query(collection(db, collectionName));
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    callback(data);
  });
}

// ─── VEHICLES ──────────────────────────────────────────────────────────────────
export function subscribeToVehicles(cb: (v: Vehicle[]) => void): Unsubscribe {
  return subscribeToCollection<Vehicle>(COLLECTIONS.VEHICLES, cb);
}

export async function addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.VEHICLES), {
    ...vehicle,
    _createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.VEHICLES, id), {
    ...data,
    _updatedAt: serverTimestamp(),
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.VEHICLES, id));
}

// ─── MAINTENANCE LOGS ──────────────────────────────────────────────────────────
export function subscribeToMaintenance(cb: (logs: MaintenanceLog[]) => void): Unsubscribe {
  return subscribeToCollection<MaintenanceLog>(COLLECTIONS.MAINTENANCE, cb);
}

export async function addMaintenanceLog(log: Omit<MaintenanceLog, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.MAINTENANCE), {
    ...log,
    _createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMaintenanceLog(id: string, data: Partial<MaintenanceLog>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.MAINTENANCE, id), data);
}

export async function deleteMaintenanceLog(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.MAINTENANCE, id));
}

// ─── MOVEMENT LOGS ─────────────────────────────────────────────────────────────
export function subscribeToMovements(cb: (logs: FleetMovementLog[]) => void): Unsubscribe {
  return subscribeToCollection<FleetMovementLog>(COLLECTIONS.MOVEMENTS, cb);
}

export async function addMovementLog(log: Omit<FleetMovementLog, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.MOVEMENTS), {
    ...log,
    _createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMovementLog(id: string, data: Partial<FleetMovementLog>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.MOVEMENTS, id), data);
}

// ─── INCIDENTS ─────────────────────────────────────────────────────────────────
export function subscribeToIncidents(cb: (incidents: Incident[]) => void): Unsubscribe {
  return subscribeToCollection<Incident>(COLLECTIONS.INCIDENTS, cb);
}

export async function addIncident(incident: Omit<Incident, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.INCIDENTS), {
    ...incident,
    _createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateIncident(id: string, data: Partial<Incident>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.INCIDENTS, id), data);
}

// ─── USERS ─────────────────────────────────────────────────────────────────────
export function subscribeToUsers(cb: (users: UserRole[]) => void): Unsubscribe {
  return subscribeToCollection<UserRole>(COLLECTIONS.USERS, cb);
}

export async function addUser(user: Omit<UserRole, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.USERS), {
    ...user,
    _createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateUser(id: string, data: Partial<UserRole>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, id), data);
}

// ─── SUPERVISOR LOGS ───────────────────────────────────────────────────────────
export function subscribeToSupervisorLogs(cb: (logs: SupervisorFleetLog[]) => void): Unsubscribe {
  return subscribeToCollection<SupervisorFleetLog>(COLLECTIONS.SUPERVISOR_LOGS, cb);
}

export async function addSupervisorLog(log: Omit<SupervisorFleetLog, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.SUPERVISOR_LOGS), {
    ...log,
    _createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSupervisorLog(id: string, data: Partial<SupervisorFleetLog>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.SUPERVISOR_LOGS, id), data);
}

// ─── WORKSHOP LOGS ─────────────────────────────────────────────────────────────
export function subscribeToWorkshopLogs(cb: (logs: WorkshopLog[]) => void): Unsubscribe {
  return subscribeToCollection<WorkshopLog>(COLLECTIONS.WORKSHOP_LOGS, cb);
}

export async function addWorkshopLog(log: Omit<WorkshopLog, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.WORKSHOP_LOGS), {
    ...log,
    _createdAt: serverTimestamp(),
  });
  return ref.id;
}

