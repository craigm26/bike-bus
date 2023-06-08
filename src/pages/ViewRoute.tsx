import {
    IonContent,
    IonPage,
    IonItem,
    IonList,
    IonLabel,
    IonButton,
    IonHeader,
    IonToolbar,
    IonCol,
    IonGrid,
    IonRow,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { DocumentReference, collection, deleteDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import ViewRouteMap from '../components/Mapping/ViewRouteMap';
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
    const [path, setPath] = useState<GeoPoint[]>([]);
    const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });    
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.lat,
        lng: startGeo.lng,
    });

    const containerMapStyle = {
        width: '100%',
        height: '100%',
    };



    const fetchRoutes = useCallback(async () => {
        const uid = user?.uid;
        if (!uid) {
            return;
        }
        const routesCollection = collection(db, 'routes');
        const q = query(routesCollection, where("routeCreator", "==", `/users/${uid}`));
        const querySnapshot = await getDocs(q);
        const routesData: Route[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as Route,
            id: doc.id,
        }));
        setRoutes(routesData);
    }, [user]);

    useEffect(() => {
        fetchRoutes();
    }, [fetchRoutes]);

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
                pathCoordinates: (docSnap.data().pathCoordinates || []).map((coord: any) => ({
                    lat: coord.latitude,
                    lng: coord.longitude,
                })),
            };
            setSelectedRoute(routeData);
        }
    };

    // make a new const to fetch the bikebusgroup name based on teh BikeBusGroupId in the route document
    const fetchBikeBusGroup = async (id: string) => {
        const docRef = doc(db, 'bikebusgroups', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const bikeBusGroupData = {
                ...docSnap.data() as BikeBusGroup,
                id: docSnap.id,
            };
            setBikeBusGroup(bikeBusGroupData);
        }
    };

    console.log(selectedRoute?.BikeBusGroupId);

    // if the route is in a bikebusgroup, then make the isGroup variable true
    const isGroup = selectedRoute?.isBikeBus;

    useEffect(() => {
        if (selectedRoute) {
            fetchBikeBusGroup(selectedRoute.id);
        }
    }
        , [selectedRoute]);


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

    console.log(selectedRoute?.startPoint.lat);
    console.log(selectedRoute?.startPoint.lng);
    console.log(selectedRoute?.endPoint.lat);
    console.log(selectedRoute?.endPoint.lng);
    console.log(selectedRoute?.startPoint);
    console.log(selectedRoute?.endPoint);

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
                    <IonRow>
                        <IonCol>
                            {!isGroup && (
                                <IonLabel>
                                    {bikeBusGroup?.name}
                                </IonLabel>
                            )}
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonButton routerLink={`/EditRoute/${id}`}>Edit Route</IonButton>
                            <IonButton onClick={deleteRoute}>Delete Route</IonButton>
                            <IonButton routerLink={'/ViewRouteList/'}>Go to Route List</IonButton>
                        </IonCol>
                    </IonRow>
                    {isGroup && (
                        <IonRow>
                            <IonCol>
                                <IonButton routerLink={`/CreateBikeBusGroup/${id}`}>Create BikeBus Group</IonButton>
                            </IonCol>
                        </IonRow>
                    )}
                    {selectedRoute && (
                        <IonRow style={{ flex: '1' }}>
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
                                        position={{ lat: startGeo.lat, lng: startGeo.lng }}
                                        title="Start"
                                    />
                                    <Marker
                                        position={{ lat: endGeo.lat, lng: endGeo.lng }}
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
                    )}
                </IonGrid>
            </IonContent>
        </IonPage>

    );

};

export default ViewRoute;
