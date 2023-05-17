import { useState, useEffect } from 'react';
import { collection, doc, getDocs, query, where } from 'firebase/firestore';
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
                    // fix the query so that the id is dynamic and accepts group.id from app.tsx or from useBikeBusGroups.tsx
                    const q = query(collection(db, 'routes'), where('bikebusgroup', '==', doc(db, 'bikebusgroups', 'r16HJ27rdbksimee4RRF')));
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
    }, [user, routeId]);

    return { fetchedRoutes, loading, error };
};

export default UseRoutes;
