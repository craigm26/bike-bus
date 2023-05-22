import {
    GoogleMap,
    useJsApiLoader,
} from "@react-google-maps/api";
import AvatarMapMarker from "../../components/AvatarMapMarker";
import AnonymousAvatarMapMarker from "../../components/AnonymousAvatarMapMarker";
import SearchDestination from "../../components/Mapping/SearchDestination";
import "./LoadMap.css";
import { IonButton } from "@ionic/react";

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

interface LoadMapProps {
    mapCenter: { lat: number; lng: number };
    isAnonymous: boolean;
    user: { uid: string } | null;
    navigate: (path: string) => void;
}

const LoadMap: React.FC<LoadMapProps> = ({ mapCenter, isAnonymous, user, navigate }) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    

    let directionsService: google.maps.DirectionsService | null = null;
    let directionsRenderer: google.maps.DirectionsRenderer | null = null;

    const getDirections = () => { /* ... */ };
    const createARoute = () => { /* ... */ };
    const findRoute = () => { /* ... */ };

    if (isLoaded) {
        directionsService = new window.google.maps.DirectionsService();
        directionsRenderer = new window.google.maps.DirectionsRenderer();

        // Call your functions here, after defining them...
    }

    // Your component must always return something
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
                        <IonButton color="primary" onClick={findRoute}>Find Route</IonButton>
                    </div>
                </div>
                {user && isAnonymous && <AnonymousAvatarMapMarker position={mapCenter} uid={user.uid} />}
                {user && !isAnonymous && <AvatarMapMarker uid={user.uid} position={mapCenter} />}
            </GoogleMap>
        </div>
    ) : null;
};

export default LoadMap;
