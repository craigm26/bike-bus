import React from "react";
import ReactDOMServer from "react-dom/server";
import Avatar from "../components/Avatar";

const AvatarMapMarker: React.FC<{ uid: string | undefined }> = ({ uid }) => {
  const content = (
    <div className="default-avatar-map-marker">
      <Avatar uid={uid} size="extrasmall" />
    </div>
  );
  return <div dangerouslySetInnerHTML={{ __html: ReactDOMServer.renderToString(content) }} />;
};

export default AvatarMapMarker;
