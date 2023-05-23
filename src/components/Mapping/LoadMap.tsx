import {
    GoogleMap,
    useJsApiLoader,
} from "@react-google-maps/api";
import AvatarMapMarker from "../../components/AvatarMapMarker";
import AnonymousAvatarMapMarker from "../AnonymousAvatarMapMarker";
import SearchDestination from "../../components/Mapping/SearchDestination";
import "./LoadMap.css";


const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

interface UserData {
    // Define the properties of the user data
    // Example properties:
    uid: string;
    username: string;
    // ...
  }

  interface LoadMapProps {
    mapCenter: { lat: number; lng: number };
    setStartPoint: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>;
    isAnonymous: boolean;
    user: UserData | null;
    navigate: (path: string) => void;
  }

const LoadMap: React.FC<LoadMapProps> = ({ mapCenter, setStartPoint, isAnonymous, user, navigate }) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    

    let directionsService: google.maps.DirectionsService | null = null;
    let directionsRenderer: google.maps.DirectionsRenderer | null = null;

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
                </div>
                {user && isAnonymous && <AnonymousAvatarMapMarker position={mapCenter} uid={user.uid} />}
                {user && !isAnonymous && <AvatarMapMarker uid={user.uid} position={mapCenter} />}
            </GoogleMap>
        </div>
    ) : null;
};

export default LoadMap;
