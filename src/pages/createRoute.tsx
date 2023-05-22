import { useState, useEffect, useContext } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { IonPage, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonInput, IonButton, IonItem, IonList, IonSelect, IonSelectOption } from '@ionic/react';
import { HeaderContext } from '../components/HeaderContext';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

interface LoadMapProps {
  mapCenter: { lat: number; lng: number };
  isAnonymous: boolean;
  user: { uid: string } | null;
  navigate: (path: string) => void;
  routeId: string;
}

interface AutocompleteInputProps {
  value: string;
  setValue: (value: string) => void;
}

const CreateRoute = ({ routeId, mapCenter }: LoadMapProps) => {
  const { user } = useAuth();
  const [routeName, setRouteName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [routeType, setRouteType] = useState<string>('');
  const [accountType, setaccountType] = useState<string>('');
  const headerContext = useContext(HeaderContext);
  const [startPoint, setStartPoint] = useState<string>('');
  const [endPoint, setEndPoint] = useState<string>('');
  const [travelMode, setTravelMode] = useState('');
  const [directionResponse, setDirectionResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [generateMap, setGenerateMap] = useState<boolean>(false);


  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  useEffect(() => {
    if (isLoaded) {
      setTravelMode('BICYCLING');
    }
  }, [isLoaded]);

  useEffect(() => {
    if (headerContext) {
      headerContext.setShowHeader(true);
    }
  }, [headerContext]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
          }
        }
      });
    }
  }, [user]);

  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>
  }

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  const AutocompleteInput = ({ value, setValue }: AutocompleteInputProps) => {
    const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
      const listener = autocomplete.addListener('place_changed', () => {
        setValue(autocomplete.getPlace()?.formatted_address || '');
      });
      return () => { google.maps.event.removeListener(listener); };
    }

    return (
      <Autocomplete onLoad={onLoad} >
        <IonInput value={value} placeholder="Enter location" />
      </Autocomplete>
    );
  };


  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, 'routes'), {
        routeName,
        description,
        startPoint,
        endPoint,
        routeType,
        accountType,
        travelMode,
        createdBy: user?.uid,
      });
      setGenerateMap(false);  // Reset after creating route
    } catch (error) {
      console.log("Error: ", error);
    }
  };


  return (
    <IonPage>
      <IonContent fullscreen>
        {headerContext?.showHeader && (
          <IonHeader>
            <IonToolbar></IonToolbar>
          </IonHeader>
        )}
        <IonToolbar>
          <IonTitle>Create a Route</IonTitle>
        </IonToolbar>
        <IonCard>
          <IonTitle>Route Name</IonTitle>
          <IonInput value={routeName} onIonChange={e => setRouteName(e.detail.value!)} />
          <IonTitle>Description</IonTitle>
          <IonInput value={description} onIonChange={e => setDescription(e.detail.value!)} />
          <IonTitle>Route Type</IonTitle>
          <IonList>
            <IonItem>
              <IonSelect
                value={routeType}
                placeholder="Select Route Type"
                onIonChange={e => setRouteType(e.detail.value)}
              >
                <IonSelectOption value="school">School</IonSelectOption>
                <IonSelectOption value="work">Work</IonSelectOption>
                <IonSelectOption value="club">Cycling Club</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonList>
          <IonTitle>Start</IonTitle>
          <AutocompleteInput value={startPoint} setValue={setStartPoint} />
          <IonTitle>End</IonTitle>
          <AutocompleteInput value={endPoint} setValue={setEndPoint} />
          <IonButton onClick={() => setGenerateMap(true)}>Generate Map</IonButton>
          <IonTitle>Preview of Route Map</IonTitle>
          {generateMap && isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '400px' }}
              center={mapCenter}
              zoom={16}
              options={{
                disableDefaultUI: true,
                zoomControl: false,
                mapTypeControl: false,
                disableDoubleClickZoom: true,
                maxZoom: 18,
              }}
            >
              <DirectionsService
                options={{
                  destination: endPoint,
                  origin: startPoint,
                  travelMode: travelMode as google.maps.TravelMode,
                }}
                callback={(res, status) => {
                  if (status === "OK") {
                    setDirectionResponse(res);
                  }
                }}
              />

              {directionResponse && <DirectionsRenderer
                options={{
                  directions: directionResponse,
                }}
              />}
            </GoogleMap>
          ) : <div>Enter the Start and End points and Click on Generate Map</div>}

          <select
            value={travelMode}
            onChange={(e) => setTravelMode(e.target.value)}
            aria-label='Travel mode'
          >
            <option value="DRIVING">Driving</option>
            <option value="WALKING">Walking</option>
            <option value="BICYCLING">Bicycling</option>
            <option value="TRANSIT">Transit</option>
          </select>
          <IonButton onClick={handleSubmit}>Create New Route</IonButton>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default CreateRoute;
