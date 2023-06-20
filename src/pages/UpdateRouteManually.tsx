import {
    IonContent,
    IonPage,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCol,
    IonRow,
    IonGrid,
} from '@ionic/react';
import { useContext, useRef, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GoogleMap, Polyline, useJsApiLoader, Marker } from '@react-google-maps/api';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


interface Coordinate {
    lat: number;
    lng: number;
}

interface Route {
    BikeBusStopName: string[];
    BikeBusStopIds: string[];
    BikeBusStop: Coordinate[] | null;
    isBikeBus: boolean;
    id: string;
    BikeBusGroupId: string;
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

const UpdateRouteManually: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const polylineRef = useRef<{ paths: Coordinate[] }>({ paths: [] });
    const [selectedStartLocation, setSelectedStartLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0, });
    const [selectedEndLocation, setSelectedEndLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>('');
    const [routeEndFormattedAddress, setRouteEndFormattedAddress] = useState<string>('');
    const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.lat,
        lng: startGeo.lng,
    });
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [pathCoordinates, setPathCoordinates] = useState<Coordinate[]>([]);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    const [BikeBusStops, setBikeBusStops] = useState<Coordinate[]>([]);


    const containerMapStyle = {
        width: '100%',
        height: '100%',
    };


    // when the map is loading, set startGeo to the route's startPoint
    useEffect(() => {
        if (selectedRoute) {
            setStartGeo(selectedRoute.startPoint);
            setEndGeo(selectedRoute.endPoint);
            setMapCenter(selectedRoute.startPoint);
            setEndGeo(selectedRoute.endPoint);
            setRouteStartFormattedAddress(selectedRoute.startPointAddress);
            setRouteEndFormattedAddress(selectedRoute.endPointAddress);
        }
    }
        , [selectedRoute]);

        console.log("selectedRoute.startPoint", selectedRoute?.startPoint);
        console.log("selectedRoute.endPoint", selectedRoute?.endPoint);
        console.log("selectedRoute.pathCoordinates", selectedRoute?.pathCoordinates);
        console.log("selectedRoute.BikeBusStop", selectedRoute?.BikeBusStop);
        console.log("selectedRoute.BikeBusStopIds", selectedRoute?.BikeBusStopIds);



    useEffect(() => {
        if (selectedRoute && selectedRoute.pathCoordinates) {
            setPathCoordinates(selectedRoute.pathCoordinates);
        }
    }, [selectedRoute]);

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
                routeName: docSnap.data().routeName,
                startPoint: docSnap.data().startPoint,
                endPoint: docSnap.data().endPoint,
                BikeBusGroupId: docSnap.data().BikeBusGroupId,
                pathCoordinates: docSnap.data().pathCoordinates, // directly assign the array
                BikeBusStop: (docSnap.data().BikeBusStop || []).map((coord: any) => ({
                    lat: coord.latitude,
                    lng: coord.longitude,
                })),
            };
            setSelectedRoute(routeData);
            setBikeBusStops(routeData.BikeBusStop);
        }
    };


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
    }
        , [user]);

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
        if (selectedStartLocation) {
            setStartGeo(selectedStartLocation);
            setMapCenter(selectedStartLocation);
        }
    }
        , [selectedStartLocation]);

    useEffect(() => {
        if (selectedEndLocation) {
            setEndGeo(selectedEndLocation);
        }
    }
        , [selectedEndLocation]);


        const handleRouteSave = async () => {
            if (selectedRoute === null) {
                console.error("selectedRoute is null");
                return;
            }
        
            const routeRef = doc(db, 'routes', selectedRoute.id);
            const updatedRoute: Partial<Route> = {
                ...selectedRoute,
                pathCoordinates,
            };
        
            // Create a skeleton object with all keys of Route but with undefined values.
            const routeSkeleton: Record<keyof Route, undefined> = {
                BikeBusStopName: undefined,
                BikeBusStopIds: undefined,
                BikeBusStop: undefined,
                isBikeBus: undefined,
                BikeBusGroupId: undefined,
                id: undefined,
                endPoint: undefined,
                endPointAddress: undefined,
                endPointName: undefined,
                routeCreator: undefined,
                routeLeader: undefined,
                routeName: undefined,
                routeType: undefined,
                startPoint: undefined,
                startPointAddress: undefined,
                startPointName: undefined,
                travelMode: undefined,
                pathCoordinates: undefined,
            };
        
            const updatedRouteWithDefaults: Record<keyof Route, string | boolean | Coordinate | string[] | Coordinate[] | null | undefined> = routeSkeleton;
        
            (Object.keys(updatedRoute) as (keyof Route)[]).forEach((key) => {
                let value = updatedRoute[key];
        
                if (value === undefined) {
                    switch (typeof updatedRoute[key]) {
                        case 'string':
                            value = '';
                            break;
                        case 'boolean':
                            value = false;
                            break;
                        case 'object':
                            // Check if it's an array
                            if (Array.isArray(updatedRoute[key])) {
                                value = [];
                            } else if(updatedRoute[key] === null){
                                value = null;
                            } else {
                                // Assuming it's Coordinate, fill with default Coordinate
                                value = {lat: 0, lng: 0};
                            }
                            break;
                        default:
                            // Throw error for unknown types
                            throw new Error(`Unexpected type for key ${key}`);
                    }
                }
        
                updatedRouteWithDefaults[key] = value;
            });
        
            console.log("updatedRouteWithDefaults", updatedRouteWithDefaults);
        
            try {
                await updateDoc(routeRef, updatedRouteWithDefaults);
                alert('Route Updated');
                history.push(`/ViewRoute/${id}`);
            } catch (err) {
                console.error(err);
            }
        };
        

    useEffect(() => {
        console.log("Google Maps script loaded: ", isLoaded);
    }, [isLoaded]);

    const handleDragEnd = (index: number) => (e: google.maps.MapMouseEvent) => {
        const newLat = e.latLng?.lat() ?? 0;
        const newLng = e.latLng?.lng() ?? 0;
        setPathCoordinates(prev => prev.map((vertex, i) => i === index ? { lat: newLat, lng: newLng } : vertex));
        console.log("handleDragEnd", index, newLat, newLng);
    };


    if (!isLoaded) {
        return <div>Loading...</div>;
    }

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
                            <IonTitle>
                                Updating Route Manually
                            </IonTitle>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonButton onClick={handleRouteSave}>Save</IonButton>
                            <IonButton routerLink={`/ViewRoute/${id}`}>Cancel</IonButton>
                        </IonCol>
                    </IonRow>
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
                                        zoomControl: true,
                                        disableDoubleClickZoom: true,
                                        disableDefaultUI: true,
                                        draggable: true,
                                        keyboardShortcuts: false,
                                        scaleControl: true,
                                        zoomControlOptions: {
                                            position: google.maps.ControlPosition.RIGHT_CENTER,
                                        },

                                        styles: [
                                            {
                                                featureType: 'poi',
                                                elementType: 'labels',
                                                stylers: [{ visibility: 'on' }],
                                            },
                                        ],
                                    }}
                                >
                                    <Marker
                                        position={{ lat: startGeo.lat, lng: startGeo.lng }}
                                        title="Start"
                                    />
                                    {BikeBusStops?.map((stop, index) => (
                                        <Marker
                                            key={index}
                                            position={stop}
                                            title={`Stop ${index + 1}`}
                                            label={`${index + 1}`}
                                            onClick={() => {
                                                console.log(`Clicked on stop ${index + 1}`);
                                            }}
                                        />
                                    ))}
                                    <Marker
                                        position={{ lat: endGeo.lat, lng: endGeo.lng }}
                                        title="End"
                                    />
                                    {
                                        selectedRoute?.pathCoordinates.length > 0 &&
                                        <Polyline
                                            path={selectedRoute.pathCoordinates}
                                            options={{ strokeColor: "#FF0000" }}
                                        />
                                    }
                                    <Polyline path={pathCoordinates} />

                                    {pathCoordinates.map((coordinate, index) => (
                                        <Marker
                                            position={coordinate}
                                            draggable={true}
                                            onDragEnd={handleDragEnd(index)}
                                        />
                                    ))}

                                </GoogleMap>

                            </IonCol>
                        </IonRow>
                    )}

                </IonGrid>
            </IonContent >
        </IonPage >
    );
};

export default UpdateRouteManually;
