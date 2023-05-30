import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Station {
    id: string;
    location: {
        lat: number;
        lng: number;
    };
}

const FetchBikeBusStations: React.FC = () => {
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'bikebusstations'));
                const fetchedStations: Station[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.location) {
                        fetchedStations.push({
                            id: doc.id,
                            location: data.location,
                        });
                    }
                });
                setStations(fetchedStations);
            } catch (error) {
                setError(error as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }


    return (
        <div>
        </div>
    );
};

export default FetchBikeBusStations;
