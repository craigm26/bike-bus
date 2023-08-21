import {
    IonContent,
    IonPage,
    IonItem,
    IonList,
    IonInput,
    IonLabel,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCol,
    IonRow,
    IonGrid,
    IonText,
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { setDoc, updateDoc, doc, getDoc, arrayUnion, addDoc, collection } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { add } from 'ionicons/icons';
import { set } from 'firebase/database';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


interface Coordinate {
    lat: number;
    lng: number;
}

interface Route {
    BikeBusGroupId: string;
    BikeBusRouteId: string;
    BikeBusStopName: string[];
    BikeBusStopIds: string[];
    BikeBusStop: Coordinate[];
    id: string;
    endPoint: Coordinate;
    endPointAddress: string;
    endPointName: string;
    startPoint: Coordinate;
    startPointAddress: string;
    startPointName: string;
    pathCoordinates: Coordinate[];
}

const DeleteBikeBusStops: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [selectedMarker, setSelectedMarker] = useState<Coordinate | null>(null);
    const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
    const [selectedStopName, setSelectedStopName] = useState<string | null>(null);
    const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.lat,
        lng: startGeo.lng,
    });
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    const [deletedStopName, setdeletedStopName] = useState<string>('');
    const [BikeBusStopName, setBikeBusStopName] = useState<string>('');
    const [BikeBusStops, setBikeBusStops] = useState<Coordinate[]>([]);

    // load the route from the url param
    useEffect(() => {
        if (id) {
            const routeRef = doc(db, 'routes', id);
            getDoc(routeRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const routeData = docSnapshot.data();
                    if (routeData) {
                        const route: Route = {
                            ...routeData,
                            // add any missing properties with the correct types
                            startPoint: routeData.startPoint as Coordinate,
                            endPoint: routeData.endPoint as Coordinate,
                            id: routeData.id ? routeData.name as string : '',
                            BikeBusGroupId: routeData.BikeBusGroupId ? routeData.BikeBusGroupId as string : '',
                            BikeBusStopName: [],
                            BikeBusRouteId: routeData.BikeBusRouteId ? routeData.BikeBusRouteId as string : '',
                            BikeBusStopIds: [],
                            BikeBusStop: [],
                            pathCoordinates: [],
                            endPointAddress: routeData.endPointAddress ? routeData.endPointAddress as string : '',
                            endPointName: routeData.endPointName ? routeData.endPointName as string : '',
                            startPointAddress: routeData.startPointAddress ? routeData.startPointAddress as string : '',
                            startPointName: routeData.startPointName ? routeData.startPointName as string : '',
                        };
                        setSelectedRoute(route);
                    }
                }
            });
        }
    }
        , [id]);

    // when the map is loading, set startGeo to the route's startPoint
    useEffect(() => {
        if (selectedRoute) {
            setStartGeo(selectedRoute.startPoint);
            setEndGeo(selectedRoute.endPoint);
            setMapCenter(selectedRoute.startPoint);
        }
    }
        , [selectedRoute]);

    useEffect(() => {
        if (headerContext) {
            headerContext.setShowHeader(true); // Hide the header for false, Show the header for true (default)
        }
    }, [headerContext]);

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

    const onMapClick = (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            const deletedStop: Coordinate = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
            };
            setBikeBusStops(prevStops => [...prevStops, deletedStop]);
        }
    };

    const adddeletedStop = async (deletedStop: Coordinate): Promise<string | null> => {
        try {
            const docRef = await addDoc(collection(db, 'bikebusstops'), deletedStop);
            return docRef.id;
            // set docRef.id as the new stop's id
        } catch (e) {
            console.error("Error adding document: ", e);
        }
        return null;
    };

    const updateBikeBusStops = async (deletedStopId: string) => {
        const bikeBusStopRef = doc(db, 'bikebusstops', deletedStopId);

        // Get the bikebusgroup's id from the selected route
        const bikeBusGroupId = selectedRoute?.BikeBusGroupId || '';

        // Get the route id from the URL parameter
        const routeId = id || '';

        await updateDoc(bikeBusStopRef, {
            BikeBusGroupId: bikeBusGroupId,
            BikeBusRouteId: routeId,
            BikeBusStopName: BikeBusStopName
        });
    };

    const handleDeleteStop = async (index: number) => {
        if (selectedRoute) {
            // Create a new array without the stop to be deleted
            const deletedStops = selectedRoute.BikeBusStop.filter((_, stopIndex) => stopIndex !== index);
      
            const newRoute: Route = {
              ...selectedRoute,
              BikeBusStop: deletedStops,
            };
    
            // Update the route in Firebase here
            await updateRoute(newRoute, selectedRoute.BikeBusStopIds[index]);
            setSelectedStopIndex(null);
        }
    };    


    const updateRoute = async (newRoute: Route, deletedStopId: string) => {
        const routeRef = doc(db, 'routes', id);
    
        const updatedBikeBusStopIds = newRoute.BikeBusStopIds.filter(id => id !== "/bikebusstops/" + deletedStopId);
        const updatedBikeBusStop = newRoute.BikeBusStop.filter((_, index) => newRoute.BikeBusStopIds[index] !== "/bikebusstops/" + deletedStopId);
    
        await updateDoc(routeRef, {
            ...newRoute,
            BikeBusStopIds: updatedBikeBusStopIds,
            BikeBusStop: updatedBikeBusStop
        });
    };
    
    
    



    if (!isLoaded) {
        return <div>Loading...</div>;
    }


    return (
        <IonPage className="ion-flex-offset-app">
        <IonContent fullscreen>
                <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <IonRow>
                        <IonCol>
                            <IonTitle>
                                Delete BikeStop
                            </IonTitle>
                        </IonCol>
                    </IonRow>
                    <IonText>Click on the BikeBusStop Marker on the map to select a location and then "delete bikebusstop"</IonText>
                    <IonButton routerLink={`/EditRoute/${id}`}>Cancel</IonButton>
                    <IonButton routerLink={`/bikebusgrouppage/${id}`}>Back to BikeBusGroup</IonButton>
                    <GoogleMap
                        mapContainerStyle={{
                            width: '100%',
                            height: '100%',
                        }}
                        center={mapCenter}
                        zoom={12}
                        options={{
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: true,
                            disableDoubleClickZoom: true,
                            disableDefaultUI: true,
                            mapId: 'b75f9f8b8cf9c287',
                        }}
                        onClick={onMapClick}
                    >
                        <Marker position={{ lat: startGeo.lat, lng: startGeo.lng }} title="Start" />
                        <Marker position={{ lat: endGeo.lat, lng: endGeo.lng }} title="End" />
                        {BikeBusStops?.map((stop, index) => (
                            <Marker
                                key={index}
                                position={stop}
                                title={`Stop ${index + 1}`}
                                label={`${index + 1}`}
                                onClick={() => {
                                    setSelectedStopIndex(index);
                                }}
                            >
                                {selectedStopIndex === index && (
                                    <InfoWindow onCloseClick={() => setSelectedStopIndex(null)}>
                                        <div>
                                            <h3>{`Stop ${index + 1}`}</h3>
                                            <button onClick={() => handleDeleteStop(index)}>Delete Stop</button>
                                        </div>
                                    </InfoWindow>
                                )}
                            </Marker>
                        ))}

                        <Polyline
                            path={selectedRoute ? selectedRoute.pathCoordinates : []}
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
                </IonGrid>
            </IonContent >
        </IonPage >
    );
};

export default DeleteBikeBusStops;
