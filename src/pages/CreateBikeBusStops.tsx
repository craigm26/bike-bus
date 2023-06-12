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
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { add } from 'ionicons/icons';
import { set } from 'firebase/database';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


interface Coordinate {
    lat: number;
    lng: number;
}

interface Route {
    BikeBusGroupId: string;
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

const CreateBikeBusStop: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [autocompleteStart, setAutocompleteStart] = useState<google.maps.places.SearchBox | null>(null);
    const [autocompleteEnd, setAutocompleteEnd] = useState<google.maps.places.SearchBox | null>(null);
    const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.lat,
        lng: startGeo.lng,
    });
    const [bikeBusStop, setbikeBusStop] = useState<Coordinate>({ lat: 0, lng: 0 });
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    const [newStopName, setNewStopName] = useState<string>('');
    const [BikeBusStopName, setBikeBusStopName] = useState<string>('');
    const [BikeBusStop, setBikeBusStop] = useState<Coordinate | null>(null);

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
            const newStop: Coordinate = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
            };
            setBikeBusStop(newStop);
        }
    };

    const addNewStop = async (newStop: Coordinate): Promise<string | null> => {
        try {
            const docRef = await addDoc(collection(db, 'bikebusstops'), newStop);
            return docRef.id;
            // set docRef.id as the new stop's id
        } catch (e) {
            console.error("Error adding document: ", e);
        }
        return null;
    };

    const updateBikeBusStops = async (newStopId: string) => {
        const BikeBusStopRef = doc(db, 'bikebusstops', newStopId);
        // also get the bikebusgroup's id - which is in the routes id from the url
        const BikeBusGroupIdRef = doc(db, 'routes', id);
        const BikeBusGroupIdSnapshot = await getDoc(BikeBusGroupIdRef);
        const BikeBusGroupId = BikeBusGroupIdSnapshot.data()?.id;
        console.log(BikeBusGroupId);
        // get the route id and add it to the bikebusstop
        const routeRef = doc(db, 'routes', id);
        const routeSnapshot = await getDoc(routeRef);
        const routeId = routeSnapshot.data()?.id;
        console.log(routeId);
        await updateDoc(BikeBusStopRef, { BikeBusRouteId: routeId });
        await updateDoc(BikeBusStopRef, { BikeBusGroupId: BikeBusGroupId });
        await updateDoc(BikeBusStopRef, { BikeBusStopName: BikeBusStopName });
    };


    const updateRoute = async (newRoute: Route, newStopId: string) => {
        const routeRef = doc(db, 'routes', id);
        await updateDoc(routeRef, { 
            ...newRoute,
            BikeBusStopName: arrayUnion(BikeBusStopName),
            BikeBusStopIds: arrayUnion("/bikebusstops/" + newStopId),
            BikeBusStop: arrayUnion(BikeBusStop)
        });
    };    


    if (!isLoaded) {
        return <div>Loading...</div>;
    }


    const onSaveStopButtonClick = async () => {
        if (selectedRoute && BikeBusStop) {
            const newStop: Coordinate = {
                lat: BikeBusStop.lat,
                lng: BikeBusStop.lng,
            };
            const newStopId = await addNewStop(newStop);
            if (newStopId) {
                const newStops: Coordinate[] = [...selectedRoute.BikeBusStop, newStop];
                const newRoute: Route = {
                    ...selectedRoute,
                    BikeBusStop: newStops as Coordinate[],
                };
                await updateRoute(newRoute, newStopId);
                await updateBikeBusStops(newStopId);
                history.push(`/EditRoute/${id}`);
            }
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
                            <IonTitle>
                                Create BikeStop
                            </IonTitle>
                        </IonCol>
                    </IonRow>
                    <IonList>
                    </IonList>
                    <IonItem>
                        <IonLabel>New BikeBus Stop Name:</IonLabel>
                        <IonInput value={BikeBusStopName} onIonChange={e => setBikeBusStopName(e.detail.value!)} />
                    </IonItem>
                    <IonText>Click on the map to select a location and then "save new bikebusstop"</IonText>
                    <IonLabel>OR Select a Location by doing a google maps api autocomplete search and then the marker will show up</IonLabel>
                    <IonItem>
                        <IonLabel>Search for a location:</IonLabel>
                    </IonItem>
                    <IonButton onClick={onSaveStopButtonClick}>Save New BikeBusStop</IonButton>
                    <IonButton routerLink={`/EditRoute/${id}`}>Cancel</IonButton>
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
                        }}
                        onClick={onMapClick}
                    >
                        <Marker position={{ lat: startGeo.lat, lng: startGeo.lng }} title="Start" />
                        <Marker position={{ lat: endGeo.lat, lng: endGeo.lng }} title="End" />
                        {BikeBusStop && (
                            <Marker
                                position={{ lat: BikeBusStop.lat, lng: BikeBusStop.lng }}
                                title={BikeBusStopName}
                            />
                        )}
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

export default CreateBikeBusStop;
