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
      <div className="default-avatar-map-marker" style={{
          position: "relative",
          display: "inline-block",
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 0 0 3px #0000ff, 0 0 10px #0000ff, 0 0 20px #0000ff",
          width: "26px",
          height: "26px"
      }}>
        <div style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
        }}>
          <Avatar uid={uid} size="extrasmall" />
        </div>
      </div>
    </OverlayView>
  );
};

export default AvatarMapMarker;
