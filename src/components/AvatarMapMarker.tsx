import React from "react";
import Avatar from "../components/Avatar";
import { OverlayView } from "@react-google-maps/api";

interface Position {
  lat: number;
  lng: number;
}

interface Props {
  uid: string | undefined;
  position: Position;
}

const AvatarMapMarker: React.FC<Props> = ({ uid, position }) => {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div className="default-avatar-map-marker">
        <Avatar uid={uid} size="extrasmall" />
      </div>
    </OverlayView>
  );
};

export default AvatarMapMarker;
