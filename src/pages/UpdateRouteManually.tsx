import {
    IonContent,
    IonPage,
    IonButton,
    IonTitle,
    IonCol,
    IonRow,
    IonGrid,
    IonText,
    IonLabel,
    IonToggle,
} from '@ionic/react';
import { useContext, useRef, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { DocumentReference, doc, getDoc, updateDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GoogleMap, Polyline, useJsApiLoader, Marker } from '@react-google-maps/api';
import React from 'react';
import { get } from 'http';

const libraries: any = ["places", "drawing", "geometry", "localContext", "visualization"];

interface DistanceDurationResult {
    distance: string;
    duration: string;
    arrivalTime: string;
  }

interface Coordinate {
    lat: number;
    lng: number;
}

interface InfoBoxState {
    show: boolean;
    content: JSX.Element | null;
    position: Coordinate | null;
}

// a BikeBusStop is an array of BikeBusStops that exist as a subcollection of the route
interface BikeBusStop {
    BikeBusGroup: DocumentReference;
    BikeBusRouteId: string;
    BikeBusStopName: string;
    id: string;
    location: Coordinate;
    placeId: string;
    photos: string;
    formattedAddress: string;
    placeName: string;
}
interface Route {
    eventCheckInLeader: any;
    startPoint: { lat: number; lng: number };
    endPoint: { lat: number, lng: number };
    pathCoordinates: { lat: number; lng: number }[];
    startPointName: string;
    endPointName: string;
    startPointAddress: string;
    endPointAddress: string;
    routeName: string;
    routeType: string;
    routeCreator: DocumentReference;
    routeLeader: DocumentReference;
    description: string;
    travelMode: string;
    isBikeBus: boolean;
    BikeBusName: string;
    BikeBusStops: BikeBusStop[];
    BikeBusGroup: DocumentReference;
    id: string;
    accountType: string;
    bicylingSpeed: string;
    bicyclingSpeedSelector: string;
    routeId: string;
    name: string;
    distance: string;
    duration: string;
    arrivalTime: string;
}


const UpdateRouteManually: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const [accountType, setaccountType] = useState<string>('');
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
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
    const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
    const polylineRef = useRef<{ paths: Coordinate[] }>({ paths: [] });
    const [bikeBusStops, setBikeBusStops] = useState<BikeBusStop[]>([]);
    const mapRef = React.useRef<google.maps.Map | null>(null);
    const [isBicyclingLayerVisible, setIsBicyclingLayerVisible] = useState(false);
    const bicyclingLayerRef = useRef<google.maps.BicyclingLayer | null>(null);
    const [travelModeSelector, setTravelModeSelector] = useState<string>('BICYCLING');
    const [bicyclingSpeedSelector, setBicyclingSpeedSelector] = useState('SLOW');
    const [bicyclingSpeed, setBicyclingSpeed] = useState(10);
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');



    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });


    const containerMapStyle = {
        width: '100%',
        height: '100%',
    };

    useEffect(() => {
        if (id) fetchSingleRoute(id);
    }, [id]);

    const selectMarkerForDeletion = (index: number) => {
        setSelectedMarkerIndex(index);
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
            setPathCoordinates(selectedRoute.pathCoordinates);
            setMapCenter({
                lat: (selectedRoute.startPoint.lat + selectedRoute.endPoint.lat) / 2,
                lng: (selectedRoute.startPoint.lng + selectedRoute.endPoint.lng) / 2,
            });
        }

        // since we have the BikeBusStopIds, we can get the BikeBusStop coordinates from the BikeBusStopIds document from the bikebusstop document collection

    }
        , [selectedRoute]);



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
                pathCoordinates: docSnap.data().pathCoordinates, // directly assign the array
            };
            console.log("routeData", routeData);
            setSelectedRoute(routeData);
        }
    };


    interface LatLng {
        latitude: number;
        longitude: number;
    }

    function perpendicularDistance(point: LatLng, linePoint1: LatLng, linePoint2: LatLng): number {
        const { latitude: x, longitude: y } = point;
        const { latitude: x1, longitude: y1 } = linePoint1;
        const { latitude: x2, longitude: y2 } = linePoint2;

        const area = Math.abs(0.5 * (x1 * y2 + x2 * y + x * y1 - x2 * y1 - x * y2 - x1 * y));
        const bottom = Math.hypot(x1 - x2, y1 - y2);
        const height = (2 * area) / bottom;

        return height;
    }

    function ramerDouglasPeucker(pointList: LatLng[], epsilon: number): LatLng[] {
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

    const getSpeedAdjustmentFactor = (speedSelector: any) => {
        switch (speedSelector) {
            case "VERY SLOW": return 1.2;
            case "SLOW": return 1.1;
            case "MEDIUM": return 1;
            case "FAST": return 0.9;
            default: return 1; // Default to no adjustment
        }
    };

    const calculateDistanceAndDuration = (origin: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place, destination: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place, travelMode: string, speedSelector: string) => {


        return new Promise<DistanceDurationResult>((resolve, reject) => {
            const service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                origins: [origin],
                destinations: [destination],
                travelMode: google.maps.TravelMode[travelMode as keyof typeof google.maps.TravelMode],
            }, (response, status) => {
                if (status === "OK" && response?.rows[0]?.elements[0]?.status === "OK") {
                    const distance = response.rows[0].elements[0].distance.value; // meters
                    let duration = response.rows[0].elements[0].duration.value; // seconds

                    // Adjust duration based on the selected speed
                    const speedFactor = getSpeedAdjustmentFactor(speedSelector);
                    duration *= speedFactor;

                    const distanceInMiles = Math.round((distance * 0.000621371) * 100) / 100;
                    const durationInMinutes = Math.round((duration / 60) * 100) / 100;

                    const arrivalTime = new Date();
                    arrivalTime.setSeconds(arrivalTime.getSeconds() + duration);
                    const arrivalTimeString = arrivalTime.toLocaleTimeString();

                    resolve({
                        distance: distanceInMiles.toString(),
                        duration: durationInMinutes.toString(),
                        arrivalTime: arrivalTimeString,
                    });
                } else {
                    reject("Error calculating distance and duration: " + status);
                }
            });
        });
    };

    const handleRouteChange = async (directionsResult: google.maps.DirectionsResult | null) => {
        // Simplify route if necessary and calculate distance and duration
        if (!directionsResult) {
            throw new Error("Directions result is null");
        }
        const pathPoints = directionsResult.routes[0].overview_path.map(latLng => ({ latitude: latLng.lat(), longitude: latLng.lng() }));
        const simplifiedPathPoints = ramerDouglasPeucker(pathPoints, 0.0001);

        // Convert LatLng objects to Coordinate objects
        const convertedPathPoints: Coordinate[] = simplifiedPathPoints.map(point => ({ lat: point.latitude, lng: point.longitude }));

        // Optionally update the state with the new simplified path points
        setPathCoordinates(convertedPathPoints);

        console.log(travelModeSelector);
        const travelMode: keyof typeof google.maps.TravelMode = travelModeSelector as keyof typeof google.maps.TravelMode;
        let speedSelector = ''; // Default to an empty string or a sensible default for other modes
        if (travelModeSelector === 'BICYCLING') {
            // Set speedSelector for BICYCLING mode based on the selected speed from the user in the state of speedSelector
            speedSelector = bicyclingSpeedSelector;
        }

        if (selectedStartLocation === null || selectedEndLocation === null) {
            console.error("Start or end location is null");
            return; // Stop the function if either is null
        }


        // Call calculateDistanceAndDuration and destructure its result
        const calculationResult = await calculateDistanceAndDuration(
            selectedStartLocation,
            selectedEndLocation,
            travelModeSelector,
            speedSelector
        );

        let distanceValue = '';
        let durationValue = '';
        let arrivalTimeValue = '';

        // Assign the results from calculationResult to the scoped variables
        distanceValue = calculationResult.distance;
        durationValue = calculationResult.duration;
        arrivalTimeValue = calculationResult.arrivalTime;

        setDistance(distanceValue);
        setDuration(durationValue);
        setArrivalTime(arrivalTimeValue);
    };

    const getDirectionsAndSimplifyRoute = async () => {
        try {
            if (!selectedStartLocation || !selectedEndLocation) {
                throw new Error("Start or end location is not set");
            }

            // Setup DirectionsService and DirectionsRenderer
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
                draggable: true,
                map: mapRef.current,
                preserveViewport: true,
            });

            let distanceValue = '';
            let durationValue = '';
            let arrivalTimeValue = '';

            if (travelModeSelector) {
                // Use travelModeSelector
                console.log(travelModeSelector);
                const travelMode = google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode];
                let speedSelector = ''; // Default to an empty string or a sensible default for other modes
                if (travelModeSelector === 'BICYCLING') {
                    // Set speedSelector for BICYCLING mode based on the selected speed from the user in the state of speedSelector
                    speedSelector = bicyclingSpeedSelector;
                    // also enable the bicycling layer if the ref is not null
                }


                // Fetch and set initial directions
                const initialResult = await directionsService.route({
                    origin: selectedStartLocation,
                    destination: selectedEndLocation,
                    travelMode: travelMode,
                });
                directionsRenderer.setDirections(initialResult);
                handleRouteChange(initialResult); // Function to process the route, calculate distances, etc.

                // Listen for directions changes (e.g., user drags the route)
                google.maps.event.addListener(directionsRenderer, 'directions_changed', () => {
                    const newDirections = directionsRenderer.getDirections();
                    handleRouteChange(newDirections); // Re-process the new route
                });

            }
        }
        catch (error) {
            console.error("Failed to get directions:", error);
            // Optionally, handle setting state to reflect the error to the user
        }
    }


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
        if (selectedStartLocation) {
            setStartGeo(selectedStartLocation);
        }

        if (selectedEndLocation) {
            setEndGeo(selectedEndLocation);
        }
    }
        , [selectedEndLocation, selectedStartLocation]);


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

        const updatedRouteWithDefaults: Record<keyof Route, string | boolean | Coordinate | string[] | Coordinate[] | DocumentReference[] | null | undefined> = {} as any;

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
                        } else if (updatedRoute[key] === null) {
                            value = null;
                        } else {
                            // Assuming it's Coordinate, fill with default Coordinate
                            value = { lat: 0, lng: 0 };
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
            await updateDoc(routeRef, updatedRoute);
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

    // delete the existing pathCoordinates in the firestore document and replace it with the new pathCoordinates by invoking a different function
    const resetPath = () => {

        getDirectionsAndSimplifyRoute();
        
        if (selectedRoute) {
            const routeRef = doc(db, 'routes', selectedRoute.id);
            const updatedRoute: Partial<Route> = {
                ...selectedRoute,
                pathCoordinates: [],
            };
            updateDoc(routeRef, updatedRoute);
        }
    };



    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <IonPage className="ion-flex-offset-app">
            <IonContent>
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
                            <IonText>Select a Marker to remove or drag the route to match the Bike Bus Stops</IonText>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonText>Marker Selected: {selectedMarkerIndex !== null ? selectedMarkerIndex : "None"}</IonText>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonButton color="success" onClick={handleRouteSave}>Save</IonButton>
                            <IonButton color="secondary" routerLink={`/ViewRoute/${id}`}>Cancel</IonButton>
                            {selectedMarkerIndex &&
                                <IonButton onClick={() => setSelectedMarkerIndex(null)}>Deselect Marker</IonButton>
                            }
                            {selectedMarkerIndex && (
                                <IonButton color="danger" onClick={() => selectedMarkerIndex !== null && setPathCoordinates(prev => prev.filter((_, i) => i !== selectedMarkerIndex))}>Delete Selected Marker</IonButton>
                            )}
                            <IonButton color="tertiary" onClick={resetPath}>Reset Path</IonButton>
                        </IonCol>
                    </IonRow>
                    {selectedRoute && (
                        <IonRow style={{ flex: '1' }}>
                            <IonCol>
                                <GoogleMap
                                    onLoad={(map) => {
                                        mapRef.current = map;
                                        bicyclingLayerRef.current = new google.maps.BicyclingLayer();
                                    }}
                                    mapContainerStyle={containerMapStyle}
                                    center={mapCenter}
                                    zoom={16}
                                    options={{
                                        zoomControl: true,
                                        zoomControlOptions: {
                                            position: window.google.maps.ControlPosition.LEFT_CENTER
                                        },
                                        mapTypeControl: false,
                                        mapTypeControlOptions: {
                                            position: window.google.maps.ControlPosition.LEFT_CENTER, // Position of map type control
                                            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain',],
                                        },
                                        streetViewControl: false,
                                        fullscreenControl: true,
                                        disableDoubleClickZoom: true,
                                        disableDefaultUI: true,
                                        mapId: 'b75f9f8b8cf9c287',
                                    }}
                                    onUnmount={() => {
                                        mapRef.current = null;
                                    }}
                                >
                                    {bikeBusStops.map((BikeBusStop, index) => (
                                        <Marker
                                            zIndex={2}
                                            key={index}
                                            label={BikeBusStop.BikeBusStopName || 'BikeBus Stop'}
                                            position={BikeBusStop.location}
                                            title={BikeBusStop.BikeBusStopName}
                                        />
                                    ))}
                                    {startGeo.lat !== 0 && startGeo.lng !== 0 && (
                                        <Marker
                                            zIndex={1}
                                            position={{ lat: startGeo.lat, lng: startGeo.lng }}
                                            title="Start"
                                            label={"Start"}
                                        />
                                    )}
                                    {endGeo.lat !== 0 && endGeo.lng !== 0 && (
                                        <Marker
                                            zIndex={1}
                                            position={{ lat: endGeo.lat, lng: endGeo.lng }}
                                            title="End"
                                            label={"End"}
                                        />
                                    )}
                                    <Polyline
                                        path={pathCoordinates}
                                        options={{
                                            strokeColor: "#88C8F7", // Main line color
                                            strokeOpacity: 1,
                                            strokeWeight: 2,
                                            icons: [
                                                {
                                                    icon: {
                                                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                                        strokeColor: "#88C8F7", // Main line color
                                                        strokeOpacity: 1,
                                                        strokeWeight: 2,
                                                        fillColor: "#88C8F7",
                                                        fillOpacity: 1,
                                                        scale: 3,
                                                    },
                                                    offset: "100%",
                                                    repeat: "100px",
                                                },
                                            ],
                                        }}
                                    />
                                    {pathCoordinates.map((coordinate, index) => (
                                        <Marker
                                            zIndex={0}
                                            position={coordinate}
                                            draggable={true}
                                            onDragEnd={handleDragEnd(index)}
                                            onClick={() => selectMarkerForDeletion(index)}
                                        />
                                    ))}
                                    <Polyline path={pathCoordinates} />
                                    {pathCoordinates.map((coordinate, index) => (
                                        <Marker
                                            label={index.toString()}
                                            title={index.toString()}
                                            zIndex={0}
                                            position={coordinate}
                                            draggable={true}
                                            onDragEnd={handleDragEnd(index)}
                                            onClick={() => selectMarkerForDeletion(index)}
                                        />
                                    ))}
                                    {bicyclingLayerRef.current && selectedRoute.travelMode === "BICYCLING" && (
                                        <IonToggle
                                            checked={isBicyclingLayerVisible}
                                            onIonChange={e => {
                                                setIsBicyclingLayerVisible(e.detail.checked);
                                                if (bicyclingLayerRef.current) {
                                                    bicyclingLayerRef.current.setMap(e.detail.checked ? mapRef.current : null);
                                                }
                                            }}
                                        >
                                            <IonLabel className="toggle-bicycle-layer">Toggle Bicycling Layer</IonLabel>
                                        </IonToggle>
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

export default UpdateRouteManually;
