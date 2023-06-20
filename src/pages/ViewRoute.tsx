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
    IonRouterLink,
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import { GeoPoint } from 'firebase/firestore';
import { useParams, useHistory, Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';


const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


interface Coordinate {
    lat: number;
    lng: number;
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
    BikeBusName: string;
    BikeBusStopName: string[];
    BikeBusStop: Coordinate[];
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
    const [BikeBusStop, setBikeBusStop] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.lat,
        lng: startGeo.lng,
    });
    const [BikeBusStops, setBikeBusStops] = useState<Coordinate[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<Coordinate | null>(null);
    const [selectedBikeBusStop, setSelectedBikeBusStop] = useState<Coordinate | null>(null);

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
                pathCoordinates: (docSnap.data().pathCoordinates || []).map((coord: any) => ({
                    lat: coord.lat,  // use 'lat' instead of 'latitude'
                    lng: coord.lng,  // use 'lng' instead of 'longitude'
                })),
                BikeBusStationsIds: (docSnap.data().BikeBusStationsIds || []).map((coord: any) => ({
                    lat: coord.lat,  // use 'lat' instead of 'latitude'
                    lng: coord.lng,  // use 'lng' instead of 'longitude'
                })),
                BikeBusStops: (docSnap.data().BikeBusStop || []).map((coord: any) => ({
                    lat: coord.lat,  // use 'lat' instead of 'latitude'
                    lng: coord.lng,  // use 'lng' instead of 'longitude'
                })),
            };
            setSelectedRoute(routeData);
            setPath(routeData.pathCoordinates);
            setBikeBusStops(routeData.BikeBusStops);
            setStartGeo(routeData.startPoint);
            setEndGeo(routeData.endPoint);
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
                    {isBikeBus && (
                        <IonRow>
                            <IonCol>
                                <IonLabel>
                                    BikeBus Group: 
                                    {selectedRoute?.BikeBusName}

                                </IonLabel>
                            </IonCol>
                        </IonRow>
                    )}
                    <IonRow>
                        <IonCol>
                            {selectedRoute?.travelMode && (
                                <IonLabel>Travel Mode: {selectedRoute?.travelMode?.charAt(0).toUpperCase() + selectedRoute?.travelMode?.slice(1)}</IonLabel>
                            )}
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
                                <IonLabel>BikeBus Stops: {(selectedRoute?.BikeBusStopName || []).join(', ')}</IonLabel>
                            </IonCol>
                        </IonRow>
                    )}
                    <IonRow>
                        <IonCol>
                            <IonButton routerLink={`/EditRoute/${id}`}>Edit Route</IonButton>
                            {!isBikeBus && (
                                <IonButton onClick={deleteRoute}>Delete Route</IonButton>
                            )}
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
                                    <Polyline
                                        path={selectedRoute?.pathCoordinates}
                                        options={{
                                            strokeColor: "#ffd800",
                                            strokeOpacity: 1.0,
                                            strokeWeight: 2,
                                            geodesic: true,
                                            draggable: false,
                                            editable: false,
                                            visible: true,
                                        }}
                                    />
                                    <Marker position={{ lat: startGeo.lat, lng: startGeo.lng }} title="Start" label="Start" onClick={() => setSelectedMarker(selectedMarker)} />
                                    <Marker position={{ lat: endGeo.lat, lng: endGeo.lng }} title="End" label="End" onClick={() => setSelectedMarker(selectedMarker)} />
                                    {selectedMarker && (
                                        <InfoWindow
                                            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                                            onCloseClick={() => setSelectedMarker(null)}
                                        >
                                            <div>
                                                <h4>Marker Data</h4>
                                                <p>Latitude: {selectedMarker.lat}</p>
                                                <p>Longitude: {selectedMarker.lng}</p>
                                            </div>
                                        </InfoWindow>
                                    )}
                                    {BikeBusStops.map((stop, index) => (
                                        <Marker
                                            key={index}
                                            position={stop}
                                            title={`Stop ${index + 1}`}
                                            label={`${index + 1}`}
                                            onClick={() => setSelectedMarker(selectedMarker)}
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
                                                {selectedMarker && (
                                                    <InfoWindow
                                                        position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                                                        onCloseClick={() => setSelectedMarker(null)}
                                                    >
                                                        {/* Content to display in the info window */}
                                                        <div>
                                                            <h4>Marker Data</h4>
                                                            <p>Latitude: {selectedMarker.lat}</p>
                                                            <p>Longitude: {selectedMarker.lng}</p>
                                                        </div>
                                                    </InfoWindow>
                                                )}
                                                <Marker
                                                    position={{ lat: startGeo.lat, lng: startGeo.lng }}
                                                    title="Start"
                                                    onClick={() => setSelectedMarker(selectedMarker)}
                                                />
                                                <Marker
                                                    position={{ lat: endGeo.lat, lng: endGeo.lng }}
                                                    title="End"
                                                    onClick={() => setSelectedMarker(selectedMarker)}
                                                />
                                            </GoogleMap>
                                            <Polyline
                                                path={selectedRoute.pathCoordinates}
                                                options={{
                                                    strokeColor: "#ffd800",
                                                    strokeOpacity: 1.0,
                                                    strokeWeight: 2,
                                                    geodesic: true,
                                                    draggable: false,
                                                    editable: false,
                                                    visible: true,
                                                }}
                                            />
                                            <Marker
                                                position={{ lat: BikeBusStop.lat, lng: BikeBusStop.lng }}
                                                title="New Stop"
                                                onClick={() => setSelectedMarker(selectedMarker)}
                                            />
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
