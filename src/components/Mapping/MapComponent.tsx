import React, { useRef, useEffect, useState } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { map } from "ionicons/icons";

const render = (status: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Iterable<React.ReactNode> | null | undefined) => {
    return <h1>{status}</h1>;
};

interface MapProps {
    center: { lat: number; lng: number };
    zoom: number;
}

interface Coordinate {
    lat: number;
    lng: number;
  }

const MapComponent: React.FC<MapProps> = ({ center, zoom }) => {
    const ref = useRef<HTMLDivElement>(null);
    // use the center prop to set the center of the map

    const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 41.8827, lng: -87.6227 });
    const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 41.8827, lng: -87.6227 });
    const [setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.lat,
        lng: startGeo.lng,
      });


    useEffect(() => {
        if (ref.current) { 
            new window.google.maps.Map(ref.current, {
                center,
                zoom,
            });
        }
    }, []);

    return <div ref={ref} id="map" style={{ width: "100%", height: "100%" }} />;
};

const MyMapComponent = () => {
    // use the prop passed from Map.tsx mapCenter to set the center of the map
    const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 41.8827, lng: -87.6227 });
    const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 41.8827, lng: -87.6227 });
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: startGeo.lat,
        lng: startGeo.lng,
      });

    const zoom = 8;

    return (
        <Wrapper apiKey="process.env.REACT_APP_GOOGLE_MAPS_API_KEY" render={render}>
            <MapComponent 
                center={mapCenter}
                zoom={zoom} />
        </Wrapper>
    );
};

export default MyMapComponent;
