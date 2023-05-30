import { useEffect, useRef } from 'react';
import { IonInput } from '@ionic/react';

interface Coordinate {
    lat: number;
    lng: number;
}

function usePlacesAutocomplete(callback: (location: Coordinate | null, name: string) => void) {
    const inputRef = useRef<HTMLIonInputElement | null>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.getInputElement().then((inputElement: HTMLInputElement) => {
                let autocomplete = new google.maps.places.Autocomplete(inputElement, {
                    types: ["(cities)"],
                });

                autocomplete.addListener("place_changed", () => {
                    let place = autocomplete.getPlace();
                    let location = place.geometry?.location;
                    callback(location ? { lat: location.lat(), lng: location.lng() } : null, place.name || '');
                });

                return () => {
                    google.maps.event.clearInstanceListeners(autocomplete);
                };
            });
        }
    }, [callback]);

    return inputRef;
}

export default usePlacesAutocomplete;
