import { useState, useEffect } from 'react';
import React from 'react';
import { GoogleMap, Polyline, Marker } from '@react-google-maps/api';
import { getDocs, collection, GeoPoint } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { LatLng } from 'use-places-autocomplete';

interface Station {
    id: string;
    location: GeoPoint;
}

interface ViewRouteMapProps {
    path: GeoPoint[];
    startGeo: GeoPoint;
    endGeo: GeoPoint;
    stations: Station[];
}

const containerStyle = {
    width: '100%',
    height: '100%',
};

const ViewRouteMap: React.FC<ViewRouteMapProps> = ({ path, startGeo, endGeo, stations }) => {
    const [stationsIDs, setStationsIDs] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);

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
                setStationsIDs(fetchedStations);
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const geoPointToLatLng = (geo: GeoPoint): LatLng => {
        return {
          lat: geo.latitude,
          lng: geo.longitude,
        };
    };

    const latLngPath = path.map(geoPoint => geoPointToLatLng(geoPoint));
    const latLngStartGeo = geoPointToLatLng(startGeo);
    const latLngEndGeo = geoPointToLatLng(endGeo);

    return (
        <GoogleMap mapContainerStyle={containerStyle} center={latLngStartGeo} zoom={10}>
            <Polyline path={latLngPath} />

            <Marker position={latLngStartGeo} />
            <Marker position={latLngEndGeo} />

            {stations.map((station, i) => (
                <Marker key={i} position={geoPointToLatLng(station.location)} />
            ))}
        </GoogleMap>
    );
};

export default ViewRouteMap;
