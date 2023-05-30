import { useState, useEffect } from 'react';
import React from 'react';
import { Polyline, Marker } from '@react-google-maps/api';
import { getDocs, collection, GeoPoint } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { LatLng } from 'use-places-autocomplete';
import { IonCol, IonContent, IonRow } from '@ionic/react';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


interface Station {
    id: string;
    location: GeoPoint;
}

interface LoadMapProps {
    mapCenter: { lat: number; lng: number };
    isAnonymous: boolean;
    user: { uid: string } | null;
    navigate: (path: string) => void;
    routeId: string;
}

interface AutocompleteInputProps {
    value: string;
    setValue: (value: string) => void;
    setAutocompleteObject: (value: google.maps.places.Autocomplete | null) => void;
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

const ViewRouteMap: React.FC<ViewRouteMapProps> = ({ startGeo, endGeo, stations }) => {
    const [stationsIDs, setStationsIDs] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);
    const [generateMap, setGenerateMap] = useState<boolean>(false);
    const [startPoint, setStartPoint] = useState<string>('');
    const [travelMode, setTravelMode] = useState('');

    const [endPoint, setEndPoint] = useState<string>();
    const [path, setPath] = useState<google.maps.LatLngLiteral[] | null>(null);
    const [BikeBusStations, setBikeBusStations] = useState<google.maps.DirectionsWaypoint[] | undefined>(undefined);
    const [startPointAutoComplete, setStartPointAutoComplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [endPointAutoComplete, setEndPointAutoComplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: 0,
        lng: 0,
    });

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

    return (
        <IonContent>
            {generateMap && (
                <IonRow>
                    <IonCol>
                        <GoogleMap
                            mapContainerStyle={{ width: "100%", height: "400px" }}
                            center={mapCenter}
                            zoom={15}
                        >

                        </GoogleMap>
                    </IonCol>
                </IonRow>
            )}
        </IonContent>
    );
};

export default ViewRouteMap;
