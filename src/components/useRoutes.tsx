import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';

interface UseRoutesProps {
    routeId: string;
}

const UseRoutes = ({ routeId }: UseRoutesProps) => {
    const { user } = useAuth();
    const [fetchedRoutes, setFetchedRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user && user.uid && user.accountType !== 'Anonymous') {
                    const q = query(collection(db, 'routes'));
                    const querySnapshot = await getDocs(q);
                    const newRoutes = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    setFetchedRoutes(newRoutes);
                } else {
                    setFetchedRoutes([]);
                }
            } catch (error) {
                console.error("Error fetching data: ", error as Error);
                setError(error as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, routeId ]);

    return { fetchedRoutes, loading, error };
};

export default UseRoutes;
