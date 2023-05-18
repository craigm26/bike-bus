// SearchDestination.tsx

import React, { useState } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";


interface LatLng {
    lat: number;
    lng: number;
}

interface SearchDestinationProps {
  currentLocation: LatLng;
  navigate: (path: string) => void;  // assuming navigate is a function that takes a path and navigates to that path
}

const SearchDestination: React.FC<SearchDestinationProps> = ({ currentLocation, navigate }) => {
  const [showCreateRouteButton, setShowCreateRouteButton] = useState(false);
  const [, setDestination] = useState<LatLng | null>(null);

  const {
      ready,
      value,
      suggestions: { status, data },
      setValue,
      clearSuggestions
  } = usePlacesAutocomplete({
      requestOptions: {
          location: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
          radius: 200 * 1000,
      },
  });

  const handleSelect = async (description: string) => {
      setValue(description, false);
      clearSuggestions();

      try {
          const results = await getGeocode({ address: description });
          const { lat, lng } = await getLatLng(results[0]);
          setDestination({ lat, lng });
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
          {showCreateRouteButton && <button onClick={() => navigate('/createRoute')}>Create Route</button>}
      </div>
  );
};

export default SearchDestination;
