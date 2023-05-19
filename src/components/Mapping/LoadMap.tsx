import {
    GoogleMap,
    useJsApiLoader,
} from "@react-google-maps/api";
import AvatarMapMarker from "../../components/AvatarMapMarker";
import AnonymousAvatarMapMarker from "../../components/AnonymousAvatarMapMarker";
import SearchDestination from "../../components/Mapping/SearchDestination";
import "./LoadMap.css";
import { IonButton } from "@ionic/react";
import createRoute from "../../pages/createRoute";
import CreateRoute from "../../pages/createRoute";

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

interface LoadMapProps {
    mapCenter: { lat: number; lng: number };
    isAnonymous: boolean;
    user: { uid: string } | null;
    navigate: (path: string) => void;
}

// build the directions service
const directionsService = new window.google.maps.DirectionsService();

// build the directions renderer
const directionsRenderer = new window.google.maps.DirectionsRenderer();

// function to get directions
const getDirections = () => {
    // get the start and end locations
    const start = { lat: 41.850033, lng: -87.6500523 };
    const end = { lat: 41.8525800, lng: -87.6514100 };

    // get the directions
    directionsService.route(
        {
            origin: start,
            destination: end,
            travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result?.routes[0]) {
                // set the directions to the map
                directionsRenderer.setDirections(result);
            } else {
                console.error(`error fetching directions ${result}`);
            }
        }
    );
};

// function to create a route
const createARoute = () => {
    // get the start and end locations
    const start = { lat: 41.850033, lng: -87.6500523 };
    const end = { lat: 41.8525800, lng: -87.6514100 };

    // get the directions
    directionsService.route(
        {
            origin: start,
            destination: end,
            travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result?.routes[0]) {
                // set the directions to the map
                directionsRenderer.setDirections(result);
            } else {
                console.error(`error fetching directions ${result}`);
            }
        }
    );
};

// function to find a route
const FindRoute = () => {
    // get the start and end locations
    const start = { lat: 41.850033, lng: -87.6500523 };
    const end = { lat: 41.8525800, lng: -87.6514100 };

    // get the directions
    directionsService.route(
        {
            origin: start,
            destination: end,
            travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result?.routes[0]) {
                // set the directions to the map
                directionsRenderer.setDirections(result);
            } else {
                console.error(`error fetching directions ${result}`);
            }
        }
    );
};



const LoadMap: React.FC<LoadMapProps> = ({ mapCenter, isAnonymous, user, navigate }) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });

    return isLoaded ? (
        <div className="map-base">
            <GoogleMap
                mapContainerStyle={{
                    width: "100%",
                    height: "100%",
                }}
                center={mapCenter}
                zoom={16}
                options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                    mapTypeControl: false,
                    disableDoubleClickZoom: true,
                    maxZoom: 18,

                }}
            >
                <div className="search-bar">
                    <SearchDestination currentLocation={mapCenter} navigate={navigate} />
                    <div className="button-container">
                        <IonButton color="primary" onClick={getDirections}>Get Directions</IonButton>
                        <IonButton color="primary" onClick={createARoute}>Create Route</IonButton>
                        <IonButton color="primary" onClick={FindRoute}>Find Route</IonButton>
                    </div>
                </div>
                {user && isAnonymous && <AnonymousAvatarMapMarker position={mapCenter} uid={user.uid} />}
                {user && !isAnonymous && <AvatarMapMarker uid={user.uid} position={mapCenter} />}
            </GoogleMap>

        </div>
    ) : null;
};

export default LoadMap;
