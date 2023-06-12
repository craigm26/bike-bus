import {
    IonContent,
    IonPage,
    IonLabel,
    IonButton,
    IonHeader,
    IonToolbar,
    IonCol,
    IonGrid,
    IonRow,
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import { GeoPoint } from 'firebase/firestore';
import { useParams, useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';


const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


interface Coordinate {
    lat: number;
    lng: number;
}

interface ViewRouteMapProps {
    startGeo: GeoPoint;
    endGeo: GeoPoint;
    stations: Station[];
    path: GeoPoint[];
}

interface BikeBusGroup {
    id: string;
    name: string;
    description: string;
    routeId: string;
}

interface Station {
    id: string;
    location: GeoPoint;
}

interface Route {
    id: string;
    BikeBusStationsIds: string[];
    BikeBusGroupId: string;
    accountType: string;
    description: string;
    endPoint: Coordinate;
    routeCreator: string;
    routeLeader: string;
    routeName: string;
    routeType: string;
    startPoint: Coordinate;
    startPointName: string;
    endPointName: string;
    startPointAddress: string;
    endPointAddress: string;
    travelMode: string;
    pathCoordinates: Coordinate[];
    isBikeBus: boolean;
}

interface Coordinate {
    lat: number;
    lng: number;
}

interface Route {
    newStop: Coordinate | null;
    oldIds: Coordinate | null;
    stopPoint: Coordinate | null;
    BikeBusStopName: string;
    BikeBusStopId: string;
    BikeBusStopIds: Coordinate[];
    BikeBusStop: Coordinate[];
    isBikeBus: boolean;
    bikeBusStop: Coordinate[];
    BikeBusGroupId: string;
    id: string;
    accountType: string;
    description: string;
    endPoint: Coordinate;
    endPointAddress: string;
    endPointName: string;
    routeCreator: string;
    routeLeader: string;
    routeName: string;
    routeType: string;
    startPoint: Coordinate;
    startPointAddress: string;
    startPointName: string;
    travelMode: string;
    pathCoordinates: Coordinate[];
}


const ViewRoute: React.FC = () => {
    const { user } = useAuth();
    const history = useHistory();

    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [routes, setRoutes] = useState<Route[]>([]);
    const { id } = useParams<{ id: string }>();
    const [bikeBusGroup, setBikeBusGroup] = useState<BikeBusGroup | null>(null);
    const [stations, setStations] = useState<Station[]>([]);
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    const [loading, setLoading] = useState(true);
    const [path, setPath] = useState<Coordinate[]>([]);
    const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [bikeBusStop, setBikeBusStop] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.lat,
        lng: startGeo.lng,
    });
    const [BikeBusStationsIds, setBikeBusStationsIds] = useState<Coordinate[]>([]);

    const containerMapStyle = {
        width: '100%',
        height: '100%',
    };

    useEffect(() => {
        if (id) fetchSingleRoute(id);
    }, [id]);

    const fetchSingleRoute = async (id: string) => {
        const docRef = doc(db, 'routes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const routeData = {
                ...docSnap.data() as Route,
                id: docSnap.id,
                startPoint: docSnap.data().startPoint,
                endPoint: docSnap.data().endPoint,
                BikeBusGroupId: docSnap.data().BikeBusGroupId,
                pathCoordinates: docSnap.data().pathCoordinates, // directly assign the array
                BikeBusStationsIds: (docSnap.data().BikeBusStationsIds || []).map((coord: any) => ({
                    lat: coord.latitude,
                    lng: coord.longitude,
                })),
            };
            setSelectedRoute(routeData);
            setPath(routeData.pathCoordinates);
            setBikeBusStationsIds(routeData.BikeBusStationsIds);
        }
    };

    // if the field isbikeBus is set to true, then make the isBikeBus variable true
    const isBikeBus = selectedRoute?.isBikeBus ?? false;

    useEffect(() => {
        if (headerContext) {
            headerContext.setShowHeader(true);
        }
    }, [headerContext]);

    // center the map between the start point of the route and the end point of the route
    useEffect(() => {
        if (selectedRoute) {
            setMapCenter({
                lat: (selectedRoute.startPoint.lat + selectedRoute.endPoint.lat) / 2,
                lng: (selectedRoute.startPoint.lng + selectedRoute.endPoint.lng) / 2,
            });
        }
    }
        , [selectedRoute]);


    useEffect(() => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    if (userData && userData.accountType) {
                        setaccountType(userData.accountType);
                    }
                }
            });
        }
    }, [user]);

    useEffect(() => {
        if (selectedRoute) {
            setStartGeo(selectedRoute.startPoint);
            setEndGeo(selectedRoute.endPoint);
        }
    }, [selectedRoute]);



    const deleteRoute = async () => {
        if (selectedRoute) {
            const routeRef = doc(db, 'routes', selectedRoute.id);
            await deleteDoc(routeRef);
            // send message to user that the route was deleted
            alert('Route Deleted');
            history.push('/viewroutelist/');
        }
    };

    return (
        <IonPage style={{ height: '100%' }}>
            <IonHeader>
                <IonToolbar>
                    {headerContext?.showHeader && <IonHeader></IonHeader>}
                </IonToolbar>
            </IonHeader>
            <IonContent style={{ height: '100%' }}>
                <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Route Name: {selectedRoute?.routeName}</IonLabel>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Description: {selectedRoute?.description}</IonLabel>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Travel Mode: {selectedRoute?.travelMode}</IonLabel>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>
                                Starting Point: {selectedRoute?.startPointAddress}
                            </IonLabel>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>
                                Ending Point: {selectedRoute?.endPointAddress}
                            </IonLabel>
                        </IonCol>
                    </IonRow>
                    {isBikeBus && (
                        <IonRow>
                            <IonCol>
                                <IonLabel>BikeBus Stops: {selectedRoute?.BikeBusStopName}</IonLabel>
                            </IonCol>
                        </IonRow>
                    )}
                    {isBikeBus && (
                        <IonRow>
                            <IonCol>
                                <IonLabel>
                                    BikeBus Group:
                                </IonLabel>
                            </IonCol>
                        </IonRow>
                    )}
                    <IonRow>
                        <IonCol>
                            <IonButton routerLink={`/EditRoute/${id}`}>Edit Route</IonButton>
                            <IonButton onClick={deleteRoute}>Delete Route</IonButton>
                            <IonButton routerLink={'/ViewRouteList/'}>Go to Route List</IonButton>
                        </IonCol>
                    </IonRow>
                    {!isBikeBus && (
                        <IonRow>
                            <IonCol>
                                <IonButton routerLink={`/CreateBikeBusGroup/${id}`}>Create BikeBus Group</IonButton>
                            </IonCol>
                        </IonRow>
                    )}
                    <IonRow style={{ flex: '1' }}>
                        <IonCol>
                            {isLoaded && selectedRoute ? (
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
                                    <Marker position={{ lat: startGeo.lat, lng: startGeo.lng }} title="Start" />
                                    <Marker position={{ lat: endGeo.lat, lng: endGeo.lng }} title="End" />
                                    {BikeBusStationsIds.map((stop, index) => (
                                        <Marker
                                            key={index}
                                            position={stop}
                                            title={`Stop ${index + 1}`}
                                            onClick={() => {
                                                console.log(`Clicked on stop ${index + 1}`);
                                            }}
                                        />
                                    ))}
                                </GoogleMap>
                            ) : (
                                <>
                                    {isLoaded && selectedRoute && (
                                        <>
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
                                                <Marker position={{ lat: startGeo.lat, lng: startGeo.lng }} title="Start" />
                                                <Marker position={{ lat: endGeo.lat, lng: endGeo.lng }} title="End" />
                                            </GoogleMap>
                                            {selectedRoute?.pathCoordinates && (
                                                <Polyline
                                                    path={selectedRoute.pathCoordinates}
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
                                            )}
                                            {bikeBusStop && (
                                                <Marker
                                                    position={{ lat: bikeBusStop.lat, lng: bikeBusStop.lng }}
                                                    title="New Stop"
                                                    onClick={() => {
                                                        console.log("Clicked on new stop");
                                                    }}
                                                />
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>

    );

};

export default ViewRoute;
