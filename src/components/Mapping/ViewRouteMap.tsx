import { useState, useEffect } from 'react';
import React from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { getDocs, collection, GeoPoint } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { IonCol, IonContent, IonIcon, IonRow } from '@ionic/react';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


interface Station {
    id: string;
    location: GeoPoint;
}

interface ViewRouteMapProps {
    startGeo: GeoPoint;
    endGeo: GeoPoint;
    stations: Station[];
    path: GeoPoint[];
}


const containerMapStyle = {
    width: '100%',
    height: '600px',
};

const ViewRouteMap: React.FC<ViewRouteMapProps> = ({ startGeo, endGeo, stations, path }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    const [stationsIDs, setStationsIDs] = useState<Station[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.latitude,
        lng: startGeo.longitude,
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
    
    if (loadError) {
        return <div>Error loading maps</div>;
    }

    return isLoaded ? (
        <IonContent>
            <IonRow>
                <IonCol>
                    <GoogleMap
                        mapContainerStyle={containerMapStyle}
                        center={mapCenter}
                        zoom={12}
                        options={{
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: true,
                            disableDoubleClickZoom: true,
                            disableDefaultUI: true, 
                        }}
                    >
                        <Marker
                            position={{ lat: startGeo.latitude, lng: startGeo.longitude }}
                            title="Start"
                        
                        />
                        <Marker
                            position={{ lat: endGeo.latitude, lng: endGeo.longitude }}
                            title="End"
                          
                        />
                        <Polyline
                            path={path.map(geoPoint => ({ lat: geoPoint.latitude, lng: geoPoint.longitude }))}
                            options={{
                                strokeColor: "#FF0000",
                                strokeOpacity: 1.0,
                                strokeWeight: 2,
                                geodesic: true,
                                draggable: true,
                                editable: true,
                                visible: true,

                            }}
                        />
                    </GoogleMap>
                </IonCol>
            </IonRow>
        </IonContent>
    ) : <div>Loading...</div>;
};

export default ViewRouteMap;
