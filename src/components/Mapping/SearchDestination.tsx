// SearchDestination.tsx

import { IonButton } from "@ionic/react";
import React, { useState, useContext } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng, getDetails } from "use-places-autocomplete";
import { RouteContext } from "../RouteContext";
import { MapContext } from "./MapContext";

interface LatLng {
  lat: number;
  lng: number;
}

interface SearchDestinationProps {
  currentLocation: LatLng;
  navigate: (path: string) => void;
}

const SearchDestination: React.FC<SearchDestinationProps> = ({ currentLocation, navigate }) => {
  const [showCreateRouteButton, setShowCreateRouteButton] = useState(false);
  const [, setDestination] = useState<LatLng | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const { setEndPoint } = useContext(RouteContext);

  // SearchDestination.tsx
  const mapContext = useContext(MapContext);

  if (!mapContext) {
    throw new Error("MapContext is not provided");
  }

  if (mapContext === null) {
    throw new Error("MapContext is not provided");
  }

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions
  } = usePlacesAutocomplete({
    requestOptions: {
      locationBias: {
        center: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
        radius: 200 * 1000,
      },
    },
  });


  const handleSelect = async (description: string) => {
    setValue(description, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
      setEndPoint({ lat, lng });
      const details = await getDetails({ placeId: results[0].place_id });
      setDestination({ lat, lng });
      setSelectedLocation({ lat, lng });
      setMapCenter(currentLocation);
      if (typeof details !== 'string' && details.place_id !== undefined) {
        setSelectedPlaceId(details.place_id);
      }
      setShowCreateRouteButton(true);
    } catch (error) {
      console.log('Error: ', error);
    }


  };

  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} disabled={!ready} placeholder="Enter a destination" />
      {status === 'OK' && data.map((suggestion) => (
        <div key={suggestion.place_id} onClick={() => handleSelect(suggestion.description)}>
          {suggestion.description}
        </div>
      ))}
      <div>
        {showCreateRouteButton && <IonButton onClick={() => navigate('/getDirections')}>Get Directions</IonButton>}
        {showCreateRouteButton && <IonButton onClick={() => navigate('/createRoute')}>Create Route</IonButton>}
        {showCreateRouteButton && <IonButton onClick={() => navigate('/findRoute')}>Find Route</IonButton>}
      </div>
    </div>
  );
}

export default SearchDestination;
