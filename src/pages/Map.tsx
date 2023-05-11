import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonMenuButton,
  IonButtons,
  IonButton,
  IonLabel,
  IonText,
  IonChip,
  IonAvatar,
  IonPopover,
  IonIcon,
} from "@ionic/react";
import { useState, useEffect, useCallback } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import Avatar from "../components/Avatar";
import Profile from "../components/Profile";
import { personCircleOutline } from "ionicons/icons";
import { ref, set } from "firebase/database";
import { rtdb } from "../firebaseConfig";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView
} from "@react-google-maps/api";
import AvatarMapMarker from "../components/AvatarMapMarker";
import MapModeSelector from "../components/MapModeSelector";

const Map: React.FC = () => {
  const { user } = useAuth();
  const [showPopover, setShowPopover] = useState(false);
  const [MapMode, setMapMode] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });
  const [getLocationClicked, setGetLocationClicked] = useState(false);
  const MapModes = [
    'Bicycle',
    'Car',
  ];

  

  const togglePopover = () => {
    setShowPopover((prevState) => !prevState);
  };

  const onMapModeChange = (mode: string[]) => {
    setMapMode(mode);
    setShowPopover(false);
  };

  const getLocation = () => {
    setGetLocationClicked(true);
    setShowMap(true);
  };

  const watchLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const newMapCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(newMapCenter);

          // Save geolocation to the realtime database
          if (user) {
            const positionRef = ref(rtdb, `userLocations/${user.uid}`);
            set(positionRef, newMapCenter);
          }
        },
        (error) => console.log(error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    }
  }, [user]);

  useEffect(() => {
    if (user && getLocationClicked) {
      watchLocation();
    }
  }, [user, getLocationClicked, watchLocation]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
  });

  let label = user?.username ? user.username : "anonymous";

  if (!user) {
    label = "anonymous";
  }
  
  const avatarElement = label === "anonymous" ? (
    <IonIcon icon={personCircleOutline} />
  ) : (
    <IonAvatar>
      <Avatar uid={user?.uid} size="extrasmall" />
    </IonAvatar>
  );
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonText slot="start" color="primary" class="BikeBusFont">
            <h1>BikeBus</h1>
          </IonText>
            <MapModeSelector
              enabledModes={MapModes}
              value={MapMode}
              onMapModeChange={onMapModeChange}
            />
          <IonButton fill="clear" slot="end" onClick={togglePopover}>
            <IonChip>
              {avatarElement}
              <IonLabel>{label}</IonLabel>
            </IonChip>
          </IonButton>
          <IonPopover
            isOpen={showPopover}
            onDidDismiss={() => setShowPopover(false)}
            className="my-popover"
          >
            <Profile />
          </IonPopover>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {!showMap && (
          <div className="location-button-container">
            <IonButton onClick={getLocation}>Get Current Location</IonButton>
          </div>
        )}        {isLoaded && showMap && (
          <GoogleMap
            mapContainerStyle={{
              width: "100%",
              height: "100%",
            }}
            center={mapCenter}
            zoom={16}
            options={{
            }}
          >
            <OverlayView
              position={mapCenter}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <AvatarMapMarker uid={user?.uid} />
            </OverlayView>
          </GoogleMap>

        )}
      </IonContent>
    </IonPage>
  );
};

export default Map;

