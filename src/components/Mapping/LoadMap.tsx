import {
    GoogleMap,
    useJsApiLoader,
    Marker,
} from "@react-google-maps/api";
import { useEffect, useState } from 'react';
import AvatarMapMarker from "../../components/AvatarMapMarker";
import AnonymousAvatarMapMarker from "../AnonymousAvatarMapMarker";
import SearchDestination from "../../components/Mapping/SearchDestination";
import "./LoadMap.css";

const libraries: any = ["places", "drawing", "geometry", "localContext", "visualization"];

interface LatLng {
  lat: number;
  lng: number;
}

interface UserData {
    // Define the properties of the user data
    // Example properties:
    uid: string;
    username: string;
    // ...
}

interface LoadMapProps {
    mapCenter: LatLng;
    selectedLocation: LatLng | null;
    isAnonymous: boolean;
    user: UserData | null;
    navigate: (path: string) => void;
}

const LoadMap: React.FC<LoadMapProps> = ({ mapCenter, selectedLocation, isAnonymous, user, navigate }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });
    
    useEffect(() => {
        console.log("Google Maps script loaded: ", isLoaded);
        console.log("Google Maps load error: ", loadError);
    }, [isLoaded, loadError]);
    
   

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
                    <SearchDestination
                        currentLocation={mapCenter}
                        navigate={navigate}
                    />
                </div>
                {user && isAnonymous && <AnonymousAvatarMapMarker position={mapCenter} uid={user.uid} />}
                {user && !isAnonymous && <AvatarMapMarker uid={user.uid} position={mapCenter} />}
                {selectedLocation && <Marker position={selectedLocation} />} {/* Add this line */}
            </GoogleMap>
        </div>
    ) : null;
};

export default LoadMap;
