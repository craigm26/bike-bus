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
import { doc, getDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


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
    const [stop, setStop] = useState<Coordinate | null>(null);






    // if the BikeBusGroupId is not null, then make the isGroup variable true

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
            setStop(newStop);
        }
    };

    const onSaveStopButtonClick = async () => {
        console.log("Saving new stop: ", stop);
        // save to route as a new stop point in the pathCoordinates array and bikebusstopIds array
    };


    useEffect(() => {
        console.log("Google Maps script loaded: ", isLoaded);
    }, [isLoaded]);

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
                                Create BikeStop
                            </IonTitle>
                        </IonCol>
                    </IonRow>
                    <IonList>
                    </IonList>
                    <IonItem>
                        <IonLabel>New BikeBus Stop Name:</IonLabel>
                        <IonInput value={newStopName} onIonChange={e => setNewStopName(e.detail.value!)} />
                    </IonItem>
                    <IonText>Click on the map to select a location and then "save new bikebusstop"</IonText>
                    <IonButton onClick={onSaveStopButtonClick}>Save New BikeBusStop</IonButton>
                    <IonButton routerLink={`/ViewRoute/${id}`}>Cancel</IonButton>
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
                        <Marker
                            position={{ lat: startGeo.lat, lng: startGeo.lng }}
                            title="Start"
                        />
                        {stop && (
                            <Marker
                                position={{ lat: stop.lat, lng: stop.lng }}
                                title={newStopName}
                            />
                        )}
                    </GoogleMap>


             
            </IonGrid>
        </IonContent >
        </IonPage >
    );
};

export default CreateBikeBusStop;
