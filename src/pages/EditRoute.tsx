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
    InputChangeEventDetail,
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
    BikeBusGroupId: string;
    BikeBusStationIds: string[] | (() => string[]);
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
    const [bikeBusStops, setBikeBusStops] = useState<Coordinate[]>([]);
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    const [userLocationAddress, setUserLocationAddress] = useState("Loading...");
    const [bikeBusStationIds, setBikeBusStationIds] = useState<string[]>(selectedRoute ? selectedRoute.BikeBusStationIds : []);
    const [showModal, setShowModal] = useState(false);
    const [searchInput, setSearchInput] = useState("");



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

    // instead of a handleMapClick, we need to use the add stop button to add a stop to the route
    //const handleCreateBikeBusStopButton = () => {
    //    alert("Select a location on the map to add a stop or search for a location in the search box");
    //    handleMapClick();
    //};

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


    const handleMapClick = async (e?: google.maps.MapMouseEvent) => {
        if (selectedRoute === null) {
            console.log('No route selected');
            return;
        }

        // show the automcomplete search box and use that to set the new stop
        // if the user clicks on the map, use that to set the new stop


        let newStop: Coordinate;
        if (e && e.latLng) {
            newStop = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        } else {
            newStop = endGeo;
        }

        // Calculate where to insert the new stop
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

        // Insert the new stop at the calculated position
        const newPathCoordinates = [...selectedRoute.pathCoordinates];
        newPathCoordinates.splice(insertPosition, 0, newStop);

        // use the new map click as a "BikeBusStationIds" geopoin in the field array of the route document
        // add the new stop to the bikeBusStops array
        setBikeBusStops([...bikeBusStops, newStop]);

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

        // After adding a new stop and saving to the bikebusstations collection, add the id (document) to bikeBusStationIds array
        // add the new stop to the bikebusstations collection as a new document
        const addBikeBusStation = async (newStop: Coordinate) => {
            const bikeBusStationsCollection = collection(db, 'bikebusstations');

            const newBikeBusStationRef = await addDoc(bikeBusStationsCollection, {
                BikeBusGroupId: selectedRoute.BikeBusGroupId,
                endPoint: newStop,
                startPoint: newStop,
                // include other fields as needed
            });
            return newBikeBusStationRef.id;
        };

        const newBikeBusStationId = await addBikeBusStation(newStop);
        setBikeBusStationIds(prevIds => [...prevIds, newBikeBusStationId]);
    };






    const handleSave = async () => {
        if (!selectedRoute) {
            return;
        }

        const routeRef = doc(db, 'routes', selectedRoute.id);
        const updatedRoute: Partial<Route> = {
            routeName: selectedRoute.routeName,
            BikeBusStationIds: bikeBusStationIds,
            description: selectedRoute.description,
            routeType: selectedRoute.routeType,
            travelMode: selectedRoute.travelMode,
            startPoint: selectedRoute.startPoint,
            endPoint: selectedRoute.endPoint,
        };
        await updateDoc(routeRef, updatedRoute);
        alert('Route Updated');
        history.push(`/ViewRoute/${selectedRoute.id}`)
    };

    // Open the modal when user clicks on 'Add BikeBusStop' button
    const handleCreateBikeBusStopButton = () => {
        setShowModal(true);
    };

    // Close the modal
    const handleCloseModal = () => {
        setShowModal(false);
    };

// Update search input
const handleSearchInputChange = (event: CustomEvent<InputChangeEventDetail>) => {
    setSearchInput(event.detail.value || "");
};



    // Search function to use with Google Autocomplete or Places API
    const handleSearch = () => {
        // Use Google Autocomplete or Places API to search with searchInput
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
                            <IonButton onClick={handleSave}>Save</IonButton>
                            <IonButton routerLink={`/ViewRoute/${id}`}>Cancel</IonButton>
                        </IonCol>
                    </IonRow>
                    <div style={{ position: 'relative' }}>
                        {selectedRoute && !showModal &&(
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
                                        {bikeBusStops.map((stop, index) => (
                                            <Marker
                                                key={index}
                                                position={stop}
                                                title={`Stop ${index + 1}`}
                                                onClick={() => {
                                                    console.log(`Clicked on stop ${index + 1}`);
                                                }}
                                            />
                                        ))}
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
                                    <h1>Select a location</h1>
                                    <IonInput value={searchInput} placeholder="Enter location" onIonChange={handleSearchInputChange}></IonInput>
                                    <IonButton onClick={handleSearch}>Search</IonButton>
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
                                        onClick={handleMapClick}
                                    >
                                        <Marker
                                            position={{ lat: startGeo.lat, lng: startGeo.lng }}
                                            title="Start"
                                        />
                                        <Marker
                                            position={{ lat: endGeo.lat, lng: endGeo.lng }}
                                            title="End"
                                        />
                                        {bikeBusStops.map((stop, index) => (
                                            <Marker
                                                key={index}
                                                position={stop}
                                                title={`Stop ${index + 1}`}
                                                onClick={() => {
                                                    console.log(`Clicked on stop ${index + 1}`);
                                                }}
                                            />
                                        ))}
                                        <IonButton onClick={handleCloseModal}>Close</IonButton>
                                    </GoogleMap>
                                </IonModal>

                            </div>
                        )}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h2>BikeBusStation IDs</h2>
                                {bikeBusStationIds.map((id, index) => (
                                    <p key={index}>{id}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </IonGrid>
            </IonContent >
        </IonPage >
    );
};

export default EditRoute;
