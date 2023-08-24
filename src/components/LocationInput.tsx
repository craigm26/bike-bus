import { de } from 'date-fns/locale';
import { on } from 'events';
import React, { useState, useRef, useEffect } from 'react';


function LocationInput({ onLocationChange, onPlaceSelected, defaultLocation = '', onPhotos }: { onLocationChange: (location: string) => void; onPlaceSelected?: (place: google.maps.places.PlaceResult) => void; defaultLocation?: string; onPhotos?: (photoUrl: string) => void; }) {
  const [location, setLocation] = useState(defaultLocation);
  const autoCompleteRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const google = window.google;
    if (autoCompleteRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(autoCompleteRef.current);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const address = place.formatted_address || '';
        setLocation(address);
        onLocationChange(address);
        if (onPlaceSelected) {
          onPlaceSelected(place);
        }
        if (place.photos && place.photos.length > 0) {
          const photoUrl = place.photos[0].getUrl(); // Get the URL of the first photo
          console.log(photoUrl);
          if (onPhotos) { // Check if the onPhotos prop is provided
            onPhotos(photoUrl);
          }
        }
      });
    }
  }, []);

  return (
    <div>
      <input
        ref={autoCompleteRef}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Enter Location"
        value={location}
        style={{ width: '100%' }}
      />
    </div>
  );
}

export default LocationInput;
