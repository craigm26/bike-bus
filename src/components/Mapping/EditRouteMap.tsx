import { useState, useEffect } from 'react';
import { Polyline, Marker } from '@react-google-maps/api';
import { getDocs, collection, GeoPoint } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { IonCol, IonContent, IonRow } from '@ionic/react';
import { GoogleMap } from '@react-google-maps/api';

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

const EditRouteMap: React.FC<ViewRouteMapProps> = ({ startGeo, endGeo, stations }) => {
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: 0,
        lng: 0,
    });

    useEffect(() => {
        setMapCenter({
            lat: startGeo.latitude,
            lng: startGeo.longitude,
        });
        setLoading(false);
    }, [startGeo]);

    const geoPointToLatLng = (geo: GeoPoint) => {
        return {
            lat: geo.latitude,
            lng: geo.longitude,
        };
    };

    const pathLatLng = stations.map(station => geoPointToLatLng(station.location));

    return (
        <IonContent>
            {!loading && (
                <IonRow>
                    <IonCol>
                        <GoogleMap
                            mapContainerStyle={{ width: "100%", height: "400px" }}
                            center={mapCenter}
                            zoom={15}
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
                                path={pathLatLng}
                                options={{
                                    strokeColor: "#ff2527",
                                    strokeOpacity: 0.75,
                                    strokeWeight: 2,
                                    icons: [
                                        {
                                            offset: "0",
                                            repeat: "20px"
                                        }
                                    ],
                                    editable: true,
                                    draggable: true,
                                    visible: true,
                                }}
                            />

                        </GoogleMap>
                    </IonCol>
                </IonRow>
            )}
        </IonContent>
    );
};

export default EditRouteMap;
