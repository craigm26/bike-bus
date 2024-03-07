import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Route {
  id: string;
  // Define other properties for your route here
}

function useFirebaseRoutes(userId: string) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      if (!userId) return; // Ensure userId is not empty
      const routesRef = collection(db, "routes");
      const q = query(routesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const fetchedRoutes: Route[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoutes(fetchedRoutes);
      setLoading(false);
    };

    fetchRoutes();
  }, [userId]);

  return { routes, loading };
}

export default useFirebaseRoutes;
