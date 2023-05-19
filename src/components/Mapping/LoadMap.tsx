import {
    GoogleMap,
    useJsApiLoader,
} from "@react-google-maps/api";
import AvatarMapMarker from "../../components/AvatarMapMarker";
import AnonymousAvatarMapMarker from "../../components/AnonymousAvatarMapMarker";
import SearchDestination from "../../components/Mapping/SearchDestination";
import "./LoadMap.css";
import { IonToolbar } from "@ionic/react";

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

    return isLoaded ? (
        <div className="map-base">
            <GoogleMap
                mapContainerStyle={{
                    width: "100%",
                    height: "100%",
                }}
                center={mapCenter}
                zoom={16}
                options={{}}
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
