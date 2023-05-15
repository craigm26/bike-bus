import React from "react";
import { useAvatar } from "./useAvatar";
import { personCircleOutline } from "ionicons/icons";
import { Marker } from "@react-google-maps/api";

interface AnonymousAvatarMapMarkerProps {
  position: { lat: number; lng: number };
  uid: string | undefined;
}

const AnonymousAvatarMapMarker: React.FC<AnonymousAvatarMapMarkerProps> = ({
    position,
  }) => {
    const { avatarUrl } = useAvatar(null);
  
    return (
      <Marker
        position={position}
        icon={{
          url: avatarUrl || personCircleOutline,
          scaledSize: new window.google.maps.Size(50, 50),
        }}
      />
    );
  };
  
export default AnonymousAvatarMapMarker;
