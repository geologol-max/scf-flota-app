/**
 * useFirestoreCollection.ts
 * Hook genérico para suscribirse en tiempo real a cualquier colección de Firestore.
 * Usa onSnapshot para actualizaciones en vivo sin necesidad de refrescar.
 */
import { useState, useEffect } from 'react';
import { subscribeToCollection } from '../lib/firestore';

interface UseCollectionReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useFirestoreCollection<T>(collectionName: string): UseCollectionReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<T>(collectionName, (items) => {
      setData(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading, error };
}
