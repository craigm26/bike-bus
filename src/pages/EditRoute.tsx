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
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
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

const EditRoute: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [selectedStartLocation, setSelectedStartLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0, });
    const [selectedEndLocation, setSelectedEndLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [routeStartName, setRouteStartName] = useState<string>('');
    const [routeEndName, setRouteEndName] = useState<string>('');
    const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>('');
    const [routeEndFormattedAddress, setRouteEndFormattedAddress] = useState<string>('');
    const [bikeBusStationsIds, setBikeBusStationsIds] = useState<Coordinate[]>([]);
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

    // if the BikeBusGroupId is not null, then make the isGroup variable true
    const isBikeBus = selectedRoute?.BikeBusGroupId !== null;

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

    function perpendicularDistance(point: Coordinate, linePoint1: Coordinate, linePoint2: Coordinate): number {
        const { lat: x, lng: y } = point;
        const { lat: x1, lng: y1 } = linePoint1;
        const { lat: x2, lng: y2 } = linePoint2;

        const area = Math.abs(0.5 * (x1 * y2 + x2 * y + x * y1 - x2 * y1 - x * y2 - x1 * y));
        const bottom = Math.hypot(x1 - x2, y1 - y2);
        const height = (2 * area) / bottom;

        return height;
    }

    function ramerDouglasPeucker(pointList: Coordinate[], epsilon: number): Coordinate[] {
        let dmax = 0;
        let index = 0;
        const end = pointList.length - 1;

        for (let i = 1; i < end; i++) {
            const d = perpendicularDistance(pointList[i], pointList[0], pointList[end]);
            if (d > dmax) {
                index = i;
                dmax = d;
            }
        }

        if (dmax > epsilon) {
            const recResults1 = ramerDouglasPeucker(pointList.slice(0, index + 1), epsilon);
            const recResults2 = ramerDouglasPeucker(pointList.slice(index, end + 1), epsilon);

            const resultPoints = [...recResults1, ...recResults2.slice(1)];
            return resultPoints;
        } else {
            return [pointList[0], pointList[end]];
        }
    }

    const calculateRoute = (waypoints: any[], selectedTravelMode: any) => {
        const batchSize = 10;
        const directionsService = new google.maps.DirectionsService();
        const batches = [];
        const epsilon = 0.01; // Define epsilon here. You might need to adjust this value based on your needs

        for (let i = 0; i < waypoints.length; i += batchSize) {
            const batch = waypoints.slice(i, i + batchSize);
            if (i !== 0) {
                batch.unshift(waypoints[i - 1]);
            }
            if (i + batchSize < waypoints.length) {
                batch.push(waypoints[i + batchSize]);
            }
            batches.push(batch);
            console.log('batch: ', batch);
        }

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const origin = batch[0].location;
            const destination = batch[batch.length - 1].location;
            const batchWaypoints = batch.slice(1, batch.length - 1);

            directionsService.route({
                origin,
                destination,
                waypoints: batchWaypoints,
                optimizeWaypoints: true,
                travelMode: selectedTravelMode,
            }, (response: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
                if (status === google.maps.DirectionsStatus.OK && response) {
                    const newRoute = response.routes[0];
                    let newRoutePathCoordinates = newRoute.overview_path.map(coord => ({ lat: coord.lat(), lng: coord.lng() }));
                    newRoutePathCoordinates = ramerDouglasPeucker(newRoutePathCoordinates, epsilon);
                    setSelectedRoute((selectedRoute) => {
                        if (!selectedRoute) {
                            return null;
                        }
                        return { ...selectedRoute, pathCoordinates: newRoutePathCoordinates };
                    });
                } else {
                    console.error('Directions request failed due to ' + status);
                }
            });
        }
    };



    const onGenerateNewRouteClick = async () => {
        if (!bikeBusStop) {
          console.error('No new stop to add to route');
          return;
        }
      
        if (bikeBusStop && selectedRoute) {
          // Calculate the distances between the new stop, start point, and end point
          const startDistance = Math.hypot(
            bikeBusStop.lat - selectedRoute.pathCoordinates[0].lat,
            bikeBusStop.lng - selectedRoute.pathCoordinates[0].lng
          );
          const endDistance = Math.hypot(
            bikeBusStop.lat - selectedRoute.pathCoordinates[selectedRoute.pathCoordinates.length - 1].lat,
            bikeBusStop.lng - selectedRoute.pathCoordinates[selectedRoute.pathCoordinates.length - 1].lng
          );
      
          // Find the closest point (start or end) to the new stop
          let insertPosition;
          if (startDistance <= endDistance) {
            insertPosition = 0; // Insert at the beginning
          } else {
            insertPosition = selectedRoute.pathCoordinates.length; // Insert at the end
          }
      
          // Create a new path with the new stop included
          const newPathCoordinates = [...selectedRoute.pathCoordinates];
          newPathCoordinates.splice(insertPosition, 0, bikeBusStop);
      
          // Simplify the new path using ramerDouglasPeucker
          const simplifiedPath = ramerDouglasPeucker(newPathCoordinates, 0.00001);
      
          setSelectedRoute({ ...selectedRoute, pathCoordinates: simplifiedPath });
      
          const selectedTravelMode = google.maps.TravelMode[selectedRoute.travelMode.toUpperCase() as keyof typeof google.maps.TravelMode];
      
          // Create waypoints excluding the start and end points
          let waypoints = simplifiedPath.slice(1, simplifiedPath.length - 1).map(coord => ({ location: coord, stopover: true }));
      
          calculateRoute(waypoints, selectedTravelMode);
        }
      };
      

    const handleRouteSave = async () => {
        if (selectedRoute === null) {
            console.error("selectedRoute is null");
            return;
        }


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
        history.push(`/ViewRouteList/`)
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
                            {isBikeBus && (
                                <IonButton routerLink={`/CreateBikeBusStops/`}>Add BikeBusStop</IonButton>
                            )}
                            <IonButton onClick={onGenerateNewRouteClick}>Generate New Route</IonButton>
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
                                    {selectedRoute.pathCoordinates && (
                                        <Polyline
                                            path={selectedRoute?.pathCoordinates}
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
                                </GoogleMap>

                            </IonCol>
                        </IonRow>
                    )}

                </IonGrid>
            </IonContent >
        </IonPage >
    );
};

export default EditRoute;
