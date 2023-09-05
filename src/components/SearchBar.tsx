import React, { useState, useRef, useEffect } from 'react';
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { get } from 'http';

interface SearchBarProps {
    setFormattedAddress: React.Dispatch<React.SetStateAction<string>>;
    setPlaceName: React.Dispatch<React.SetStateAction<string>>;
    onLocationChange?: Function;
    defaultLocation?: string;
    onPlaceSelected?: Function;
    onPhotos?: Function;
    setPlaceLatitude: React.Dispatch<React.SetStateAction<number | null>>;
    setPlaceLongitude: React.Dispatch<React.SetStateAction<number | null>>;
  }
  


function SearchBar({ setFormattedAddress, setPlaceName, setPlaceLatitude, setPlaceLongitude, defaultLocation }: SearchBarProps) {
  const [location, setLocation] = useState(defaultLocation || '');
  const autoCompleteRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    const google = window.google;
    if (autoCompleteRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(autoCompleteRef.current);
      autocomplete.addListener('place_changed', async () => {
        const place = autocomplete.getPlace();
        const address = place.formatted_address || '';
        if (place.geometry && place.geometry.location) {
            console.log(place.geometry.location.lat());
            console.log(place.geometry.location.lng());
            setPlaceLatitude(place.geometry.location.lat());
            setPlaceLongitude(place.geometry.location.lng());
          }
        setLocation(address);
        const placeName = place.name || '';
        setPlaceName(placeName);
        setFormattedAddress(address);
        console.log(place);
        console.log(placeName);
        console.log(address);
        // also run the onPlaceChangedDestination function in the parent component
        
      });
    }
  }, []);

  return (
    <div>
      <input
        ref={autoCompleteRef}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Enter Name or Location"
        value={location}
        style={{ width: '100%' }}
      />
    </div>
  );
}

export default SearchBar;
