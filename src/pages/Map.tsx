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
import { useState, useEffect } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { useAvatar } from "../components/useAvatar";
import Avatar from "../components/Avatar";
import Profile from "../components/Profile";
import { personCircleOutline } from "ionicons/icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

const Map: React.FC = () => {
  const { user } = useAuth();
  const [mapMode, setMapMode] = useState<string | null>(null);
  const { avatarUrl } = useAvatar(user?.uid);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [accountMode, setAccountMode] = useState("Member");
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.log(error),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  };

  useEffect(() => {
    const fetchUserAccountMode = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const docSnapshot = await getDoc(userRef);
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountMode) {
            setMapMode(userData.accountMode);
          }
        }
      }
    };

    fetchUserAccountMode();
  }, [user]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.defaultAccountMode) {
            setAccountMode(userData.defaultAccountMode);
          }
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getCurrentLocation();
    }
  }, [user]);

  const togglePopover = (e: any) => {
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
  };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
  });

  const avatarElement = avatarUrl ? (
    <IonAvatar>
      <Avatar uid={user?.uid} size="extrasmall" />
    </IonAvatar>
  ) : (
    <IonIcon icon={personCircleOutline} />
  );

  const label = user?.displayName ? `${user.displayName} (${accountMode})`
    : `anonymous (${accountMode})`;

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
          <IonButton fill="clear" slot="end" onClick={togglePopover}>
            <IonChip>
              {avatarElement}
              <IonLabel>{label}</IonLabel>
            </IonChip>
          </IonButton>
          <IonPopover
            isOpen={showPopover}
            event={popoverEvent}
            onDidDismiss={() => setShowPopover(false)}
            className="my-popover"
          >
            <Profile />
          </IonPopover>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar></IonToolbar>
        </IonHeader>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{
              width: "100%",
              height: "100%",
            }}
            center={mapCenter}
            zoom={16}
          >
            <Marker position={mapCenter}>
              <InfoWindow>
                <div>
                  <h4>{user?.displayName || user?.email}</h4>
                  <p>Account Mode: {mapMode}</p>
                </div>
              </InfoWindow>
            </Marker>
          </GoogleMap>

        )}
      </IonContent>
    </IonPage>
  );
};

export default Map;
