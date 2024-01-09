import { IonCol, IonContent, IonGrid, IonLabel, IonPage, IonRow } from "@ionic/react";
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import React, { useState, forwardRef, Ref } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { DocumentReference } from "firebase/firestore";

const libraries: any = ["places", "drawing", "geometry", "localContext", "visualization"];

interface Coordinate {
    lat: number;
    lng: number;
}

interface BikeBusGroup {
    name: string;
    description: string;
    BikeBusRoutes: { id: string }[];
}

interface event {
    title: string;
    route: string;
    time: string;
    leader: string;
    captains: string[];
    sheepdogs: string[];
    sprinters: string[];
    parents: string[];
    kids: string[];
    caboose: string[];
    members: string[];
    BikeBusGroup: string;
    BikeBusName: string;
}

interface Coordinate {
    lat: number;
    lng: number;
}

interface BikeBusStop {
    id: string;
    BikeBusStopName: string;
    BikBusGroupId: DocumentReference;
    BikeBusRouteId: DocumentReference;
    lat: Coordinate;
    lng: Coordinate;
    BikeBusStopIds: DocumentReference[];
    BikeBusGroupId: string;
}

interface Route {
    BikeBusName: string;
    BikeBusStopIds: DocumentReference[];
    id: string;
    BikeBusStationsIds: string[];
    BikeBusGroupId: DocumentReference;
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

interface FirestoreRef {
    path: string;
}

type LatLngCoordinate = {
    lat: number;
    lng: number;
};


interface FetchedUserData {
    username: string;
    accountType?: string;
    id: string;
    uid?: string;
}

interface Coordinate {
    lat: number;
    lng: number;
}

interface BikeBusStops {
    id: string;
    BikeBusStopName: string;
    BikBusGroupId: DocumentReference;
    BikeBusRouteId: DocumentReference;
    lat: Coordinate;
    lng: Coordinate;
}

interface routeData {
    BikeBusName: string;
    BikeBusStopIds: DocumentReference[];
    id: string;
    BikeBusGroupId: DocumentReference;
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

type FlyerProps = {
    eventData: event;
    routeData: routeData;
    ref: any;
};

// get data from the parent component (event.tsx) - props should include event data and route data and pass it to the child component Flyer
const Flyer = forwardRef<HTMLDivElement, FlyerProps>((props, ref) => {
    const { eventData, routeData } = props;
    const { user } = useAuth(); // Use the useAuth hook to get the user object
    const { avatarUrl } = useAvatar(user?.uid);
    const mapRef = React.useRef<google.maps.Map | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    const [bikeBusGroup, setBikeBusGroup] = useState<BikeBusGroup | null>(null);
    const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [pathCoordinates, setPathCoordinates] = useState<LatLngCoordinate[]>([]);
    const [selectedEndLocation, setSelectedEndLocation] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [selectedStartLocation, setSelectedStartLocation] = useState<Coordinate>({ lat: 0, lng: 0 });

    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.lat,
        lng: startGeo.lng,
    });
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "";
    const [RouteDocId, setRouteDocId] = useState<string>('');
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapZoom, setMapZoom] = useState(13);

    type SetRoleFunction = (role: string[]) => void;

    type SetRoleDataFunction = (role: FetchedUserData[]) => void;

    const [bikeBusStops, setBikeBusStops] = useState<BikeBusStops[]>([]);
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [BikeBusName, setBikeBusName] = useState<string>(''); // BikeBusName is the name of the BikeBusGroup
    
    return (
        <div ref={ref} className="flyer">
            <div className="flyer-content">
                <div className="ion-no-padding-flyer">
                    <div className="map-base-flyer" id="map-container">
                        <GoogleMap
                            onLoad={(map) => {
                                mapRef.current = map;
                                setMapLoaded(true);
                            }}
                            mapContainerStyle={{
                                width: "100%",
                                height: "100%",
                            }}
                            center={mapCenter}
                            zoom={mapZoom}
                            options={{
                                disableDefaultUI: true,
                                zoomControl: false,
                                mapTypeControl: false,
                                disableDoubleClickZoom: true,
                                maxZoom: 18,
                                mapId: 'b75f9f8b8cf9c287',
                            }}
                        >
                            {isLoaded && pathCoordinates && pathCoordinates.length > 0 && (
                                <div>
                                    <Polyline
                                        path={pathCoordinates.map(coord => ({ lat: coord.lat, lng: coord.lng }))}
                                        options={{
                                            strokeColor: "#FFD800",
                                            strokeOpacity: 1.0,
                                            strokeWeight: 2,
                                            geodesic: true,
                                            editable: false,
                                            draggable: false,
                                            icons: [
                                                {
                                                    icon: {
                                                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                                        strokeColor: "#ffd800", // Main line color
                                                        strokeOpacity: 1,
                                                        strokeWeight: 2,
                                                        fillColor: "#ffd800",
                                                        fillOpacity: 1,
                                                        scale: 3,
                                                    },
                                                    offset: "100%",
                                                    repeat: "100px",
                                                },
                                            ],
                                        }}
                                    />
                                    {bikeBusStops.map((stop, index) => (
                                        <Marker
                                            key={index}
                                            position={{ lat: Number(stop.lat), lng: Number(stop.lng) }}
                                            label={stop.BikeBusStopName}
                                            title={stop.BikeBusStopName}
                                        />
                                    ))}
                                </div>
                            )}
                            <div>
                                {isLoaded && pathCoordinates && pathCoordinates.length > 0 && (
                                    <Marker
                                        position={selectedStartLocation}
                                        icon={{
                                            url: "/assets/markers/MarkerA.svg",
                                            scaledSize: new google.maps.Size(20, 20),
                                        }}
                                    />
                                )}
                                {isLoaded && pathCoordinates && pathCoordinates.length > 0 && (
                                    <Marker position={selectedEndLocation}
                                        icon={{
                                            url: "/assets/markers/MarkerB.svg",
                                            scaledSize: new google.maps.Size(20, 20),
                                        }}
                                    />
                                )}
                            </div>
                        </GoogleMap>
                        <div className="bikebus-event-info">
                            <div className="bikebus-event-name-flyer">
                                <span>{eventData?.BikeBusName || 'N/A'}</span>
                            </div>
                            <div className="bikebus-event-route-flyer">
                                <span>{routeData?.routeName}</span>
                            </div>
                            <div className="bikebus-event-time-flyer">
                                <span>{startTime} to {endTime}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
});

export default Flyer;