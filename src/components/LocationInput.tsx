import React, { useState, useRef, useEffect } from 'react';


function LocationInput({ onLocationChange }: { onLocationChange: (location: string) => void }) {
    const [location, setLocation] = useState('');
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
  