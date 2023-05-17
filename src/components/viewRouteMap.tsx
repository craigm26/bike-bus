import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import React from 'react';
import { GoogleMap, Polyline, Marker } from '@react-google-maps/api';

interface LatLng {
    lat: number;
    lng: number;
}

interface Station {
    station: LatLng;
    // other fields...
}

interface Route {
    path: LatLng[];
    bikebusstations: string[];
    // other fields...
}

interface ViewRouteMapProps {
    route: Route;
}

const containerStyle = {
    width: '100%',
    height: '100%',
};

const ViewRouteMap: React.FC<ViewRouteMapProps> = ({ route }) => {
    const [mapCenter] = useState(route.path[0]);
    const { user } = useAuth();
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user && user.uid && user.accountType !== 'Anonymous') {
                    const fetchedStations: Station[] = [];
                    for (let stationId of route.bikebusstations) {
                        const docRef = doc(db, 'bikebusstations', stationId);
                        const docSnapshot = await getDoc(docRef);
                        if (docSnapshot.exists()) {
                            fetchedStations.push(docSnapshot.data() as Station);
                        } else {
                            console.log("No such document!");
                        }
                    }
                    setStations(fetchedStations);
                }
            } catch (error) {
                console.error("Error fetching data: ", error as Error);
                setError(error as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, route]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={10}>
            <Polyline path={route.path} />

            {stations.map((station, i) => (
                <Marker key={i} position={station.station} />
            ))}
        </GoogleMap>
    );
};

export default ViewRouteMap;
