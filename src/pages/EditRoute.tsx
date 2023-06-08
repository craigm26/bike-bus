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
    IonSelect,
    IonSelectOption,
    IonCol,
    IonRow,
    IonGrid,
    IonModal,
    IonText,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { collection, doc, getDoc, getDocs, updateDoc, query, where, addDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import { GeoPoint } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, StandaloneSearchBox } from '@react-google-maps/api';

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
    bikeBusStop: Coordinate;   
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

const EditRoute: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [routeType, setRouteType] = useState('');
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [selectedStartLocation, setSelectedStartLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0, });
    const [selectedEndLocation, setSelectedEndLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [routeStartName, setRouteStartName] = useState<string>('');
    const [routeEndName, setRouteEndName] = useState<string>('');
    const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>('');
    const [routeEndFormattedAddress, setRouteEndFormattedAddress] = useState<string>('');

    const [autocompleteStart, setAutocompleteStart] = useState<google.maps.places.SearchBox | null>(null);
    const [autocompleteEnd, setAutocompleteEnd] = useState<google.maps.places.SearchBox | null>(null);
    const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [addingStop, setAddingStop] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.lat,
        lng: startGeo.lng,
    });
    const [bikeBusStop, setbikeBusStop] = useState<Coordinate>({lat: 0, lng: 0});
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    const [userLocationAddress, setUserLocationAddress] = useState("Loading...");
    const [showModal, setShowModal] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [newStop, setNewStop] = useState<Coordinate | null>(null);
    const [newStopName, setNewStopName] = useState<string>('');




    const onLoadDestinationValue = (ref: google.maps.places.SearchBox) => {
        setAutocompleteEnd(ref);
    };

    const containerMapStyle = {
        width: '100%',
        height: '100%',
    };

    const onLoadStartingLocation = (ref: google.maps.places.SearchBox) => {

        setAutocompleteStart(ref);
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

    const onPlaceChangedStart = () => {
        console.log("onPlaceChangedStart called");
        if (autocompleteStart !== null) {
            const places = autocompleteStart.getPlaces();
            if (places && places.length > 0) {
                console.log("Places: ", places);
                const place = places[0];
                console.log("Place: ", place);
                if (place.geometry && place.geometry.location) {
                    setSelectedStartLocation({
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    });
                    setRouteStartName(`${place.name}` ?? '');
                    setRouteStartFormattedAddress(`${place.formatted_address}` ?? '');
                    // need to set startPointAddress to the address of the selected start point
                    // need to set startPointName to the name of the selected start point

                }
            }
        }
    };

    const onPlaceChangedDestination = () => {
        console.log("onPlaceChangedDestination called");
        if (autocompleteEnd !== null) {
            const places = autocompleteEnd.getPlaces();
            if (places && places.length > 0) {
                const place = places[0];
                console.log("Place: ", place);
                if (place.geometry && place.geometry.location) {
                    setSelectedEndLocation({
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    });
                    setRouteEndName(`${place.name}` ?? '');
                    setRouteEndFormattedAddress(`${place.formatted_address}` ?? '');

                }
            }
        }
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
                })), // Transform pathCoordinates
            };
            setSelectedRoute(routeData);
            console.log(routeData.pathCoordinates, routeData.startPoint, routeData.endPoint);

        }
    };


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

    const onMapClick = (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            setNewStop({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        }
        console.log("onMapClick called");
        console.log("event.latLng: ", event.latLng);


        if (event.latLng) {
            const newStop: Coordinate = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
            };
            setNewStop(newStop);

            if (selectedRoute) {
                let insertPosition = 0;
                let minDistance = Infinity;
                for (let i = 0; i < selectedRoute.pathCoordinates.length; i++) {
                    const coord = selectedRoute.pathCoordinates[i];
                    const distance = Math.hypot(coord.lat - newStop.lat, coord.lng - newStop.lng);
                    if (distance < minDistance) {
                        minDistance = distance;
                        insertPosition = i;
                    }
                }

                const newPathCoordinates = [...selectedRoute.pathCoordinates];
                newPathCoordinates.splice(insertPosition, 0, newStop);
                setSelectedRoute({ ...selectedRoute, pathCoordinates: newPathCoordinates });

                // Define DirectionsService
                const directionsService = new google.maps.DirectionsService();

                const selectedTravelMode = google.maps.TravelMode[selectedRoute.travelMode.toUpperCase() as keyof typeof google.maps.TravelMode];

                const waypoints = newPathCoordinates.slice(1, newPathCoordinates.length - 1).map(coord => ({ location: coord, stopover: true }));

                directionsService.route({
                    origin: newPathCoordinates[0],
                    destination: newPathCoordinates[newPathCoordinates.length - 1],
                    waypoints: waypoints,
                    optimizeWaypoints: true,
                    travelMode: selectedTravelMode,
                }, (response: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
                    if (status === google.maps.DirectionsStatus.OK && response) {
                        // update your map with the new route
                    } else {
                        console.error('Directions request failed due to ' + status);
                    }
                });
            }
        }
    };

    const onSaveButtonClick = async () => {
        console.log("Saving new stop: ", bikeBusStop);
        // your existing save logic here...

        if (newStop !== null && newStopName !== '') {
            try {
                const newStopId = await handleNewBikeBusStop(newStop);
                if (newStopId) {
                    setNewStop(null);
                    console.log(`New stop saved with ID ${newStopId}`);
                } else {
                    console.error('New stop id is undefined!');
                }
            } catch (error) {
                console.error('Error saving new stop:', error);
            }
            handleCloseModal();
        } else {
            console.error('No new stop to save!');
        }
    };




    const handleNewBikeBusStop = async (newStop: Coordinate) => {
        if (selectedRoute === null) {
            console.error("selectedRoute is null");
            return;
        }

        setbikeBusStop(newStop);
        console.log("newStop: ", newStop);
        // save the new stop to the bikeBusStop collection    
        const bikeBusStopCollection = collection(db, 'bikeBusStop');
        const newbikebusstopRef = await addDoc(bikeBusStopCollection, {
            BikeBusGroupId: selectedRoute.BikeBusGroupId || "",
            stopPoint: newStop,
            BikeBusStopName: newStopName,
            // include other fields as needed

        });
        // if there is a new stop id or multiple new stop ids, save the document id from the bikeBusStop collection to the route as a reference
        // if there is no new stop id, then just save the route as is

        const routeRef = doc(db, 'routes', selectedRoute.id);
        const updatedRoute: Partial<Route> = {
            routeName: selectedRoute.routeName,
            BikeBusGroupId: selectedRoute.BikeBusGroupId,
            description: selectedRoute.description,
            routeType: selectedRoute.routeType,
            travelMode: selectedRoute.travelMode,
            startPoint: selectedRoute.startPoint,
            endPoint: selectedRoute.endPoint,
            pathCoordinates: selectedRoute.pathCoordinates,

        };
        await updateDoc(routeRef, updatedRoute);
        alert('Route Updated');
        history.push(`/EditRoute/${selectedRoute.id}`)


        return newbikebusstopRef.id;
    };


    const handleRouteSave = async () => {
        if (selectedRoute === null) {
            console.error("selectedRoute is null");
            return;
        }

        console.log("selectedRoute: ", selectedRoute);
        console.log("selectedRoute.pathCoordinates: ", selectedRoute.pathCoordinates);
        console.log("selectedRoute.startPoint: ", selectedRoute.startPoint);
        console.log("selectedRoute.endPoint: ", selectedRoute.endPoint);
        console.log("selectedRoute.BikeBusGroupId: ", selectedRoute.BikeBusGroupId);
        console.log("selectedRoute.description: ", selectedRoute.description);
        console.log("selectedRoute.routeType: ", selectedRoute.routeType);
        console.log("selectedRoute.travelMode: ", selectedRoute.travelMode);
        console.log("selectedRoute.routeName: ", selectedRoute.routeName);


        const routeRef = doc(db, 'routes', selectedRoute.id);

        const updatedRoute: Partial<Route> = {};
        if (selectedRoute.routeName !== undefined) updatedRoute.routeName = selectedRoute.routeName;
        if (selectedRoute.BikeBusGroupId !== undefined) updatedRoute.BikeBusGroupId = selectedRoute.BikeBusGroupId;
        if (selectedRoute.description !== undefined) updatedRoute.description = selectedRoute.description;
        if (selectedRoute.routeType !== undefined) updatedRoute.routeType = selectedRoute.routeType;
        if (selectedRoute.travelMode !== undefined) updatedRoute.travelMode = selectedRoute.travelMode;
        if (selectedRoute.startPoint !== undefined) updatedRoute.startPoint = selectedRoute.startPoint;
        if (selectedRoute.endPoint !== undefined) updatedRoute.endPoint = selectedRoute.endPoint;
        if (selectedRoute.pathCoordinates !== undefined) updatedRoute.pathCoordinates = selectedRoute.pathCoordinates;

        await updateDoc(routeRef, updatedRoute);
        alert('Route Updated');
        history.push(`/ViewRouteList/${selectedRoute.id}`)
    };


    // Open the modal when user clicks on 'Add BikeBusStop' button
    const handleCreateBikeBusStopButton = () => {
        setShowModal(true);
    };

    // Close the modal
    const handleCloseModal = () => {
        setShowModal(false);
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
                                Editing Route
                            </IonTitle>
                        </IonCol>
                    </IonRow>
                    <IonList>
                        <IonItem>
                            <IonLabel>Route Name:</IonLabel>
                            <IonInput value={selectedRoute?.routeName} onIonChange={e => selectedRoute && setSelectedRoute({ ...selectedRoute, routeName: e.detail.value! })} />
                        </IonItem>
                        <IonItem>
                            <IonLabel>Description:</IonLabel>
                            <IonInput value={selectedRoute?.description} onIonChange={e => selectedRoute && setSelectedRoute({ ...selectedRoute, description: e.detail.value! })} />
                        </IonItem>
                        <IonItem>
                            <IonLabel>Travel Mode:</IonLabel>
                            <IonSelect aria-label='Travel Mode' value={selectedRoute?.travelMode} onIonChange={e => selectedRoute && setSelectedRoute({ ...selectedRoute, travelMode: e.detail.value })}>
                                <IonSelectOption value="WALKING">Walking</IonSelectOption>
                                <IonSelectOption value="BICYCLING">Bicycling</IonSelectOption>
                                <IonSelectOption value="CAR">Car</IonSelectOption>
                            </IonSelect>
                        </IonItem>
                        <IonItem>
                            <IonLabel>Start Point:</IonLabel>
                            <StandaloneSearchBox
                                onLoad={onLoadStartingLocation}
                                onPlacesChanged={onPlaceChangedStart}
                            >
                                <input
                                    type="text"
                                    autoComplete="on"
                                    placeholder={routeStartFormattedAddress}
                                    style={{
                                        width: "350px",
                                        height: "40px",
                                    }}
                                />
                            </StandaloneSearchBox>
                        </IonItem>
                        <IonItem>
                            <IonLabel>End Point:</IonLabel>
                            <StandaloneSearchBox
                                onLoad={onLoadDestinationValue}
                                onPlacesChanged={onPlaceChangedDestination}
                            >
                                <input
                                    type="text"
                                    autoComplete="on"
                                    placeholder={routeEndFormattedAddress}
                                    style={{
                                        width: "350px",
                                        height: "40px",
                                    }}
                                />
                            </StandaloneSearchBox>
                        </IonItem>
                    </IonList>
                    <IonRow>
                        <IonCol>
                            <IonButton onClick={handleCreateBikeBusStopButton}>Add BikeBusStop</IonButton>
                            <IonButton onClick={handleRouteSave}>Save</IonButton>
                            <IonButton routerLink={`/ViewRoute/${id}`}>Cancel</IonButton>
                        </IonCol>
                    </IonRow>
                    {selectedRoute && !showModal && (
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
                                    {bikeBusStop && (
                                        <Marker
                                        position={{ lat: bikeBusStop.lat, lng: bikeBusStop.lng }}
                                            title="New Stop"
                                            onClick={() => {
                                                console.log("Clicked on new stop");
                                            }}
                                        />
                                    )}

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
                                </GoogleMap>

                            </IonCol>
                        </IonRow>
                    )}
                    {selectedRoute && showModal && (
                        <div>
                            <IonModal isOpen={showModal} onDidDismiss={handleCloseModal}>
                                <IonItem>
                                    <IonLabel>New BikeBus Stop Name:</IonLabel>
                                    <IonInput value={newStopName} onIonChange={e => setNewStopName(e.detail.value!)} />
                                </IonItem>
                                <IonText>Click on the map to select a location</IonText>
                                <IonButton onClick={onSaveButtonClick}>Save New BikeBusStop</IonButton>
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
                                    <Marker
                                        position={{ lat: endGeo.lat, lng: endGeo.lng }}
                                        title="End"
                                    />
                                        <Marker
                                            position={bikeBusStop}
                                            title={newStopName}
                                        />
                                    <IonButton onClick={handleCloseModal}>Close</IonButton>
                                </GoogleMap>
                            </IonModal>

                        </div>
                    )}
                </IonGrid>
            </IonContent >
        </IonPage >
    );
};

export default EditRoute;
