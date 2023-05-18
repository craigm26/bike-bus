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
  IonTitle,
} from "@ionic/react";
import { useState, useEffect, useCallback } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import Avatar from "../components/Avatar";
import Profile from "../components/Profile";
import { personCircleOutline } from "ionicons/icons";
import { ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import {
  useJsApiLoader,
} from "@react-google-maps/api";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAvatar } from '../components/useAvatar';
import { useHistory } from 'react-router-dom';
import LoadMap from "../components/Mapping/LoadMap";


const DEFAULT_ACCOUNT_MODES = ['Member'];



const Map: React.FC = () => {
  const { user, isAnonymous } = useAuth();
  const [accountType, setaccountType] = useState<string>('');
  const { avatarUrl } = useAvatar(user?.uid);
  const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
  const [username, setusername] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });
  const [getLocationClicked, setGetLocationClicked] = useState(false);

  const togglePopover = () => {
    setShowPopover((prevState) => !prevState);
  };

  const getLocation = () => {
    setGetLocationClicked(true);
    setShowMap(true);
  };

  const history = useHistory();
  const navigate = (path: string) => {
    history.push(path);
  };

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.enabledAccountModes) {
            setEnabledAccountModes(userData.enabledAccountModes);
          } else {
            setEnabledAccountModes(DEFAULT_ACCOUNT_MODES);
            updateDoc(userRef, { enabledAccountModes: DEFAULT_ACCOUNT_MODES });
          }
          if (userData && userData.username) {
            setusername(userData.username);
          }
          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
          }
        }
      });
    }
  }, [setEnabledAccountModes, user]);


  const watchLocation = useCallback(() => {
    if (navigator.geolocation) {
      // Get initial location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newMapCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(newMapCenter);
        },
        (error) => console.log(error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );

      // Watch location for changes
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
    libraries: ["places"],
  });

  let label = user?.username ? user.username : "anonymous";

  if (!user) {
    label = "anonymous";
  }

  const avatarElement = user ? (
    avatarUrl ? (
      <IonAvatar>
        <Avatar uid={user.uid} size="extrasmall" />
      </IonAvatar>
    ) : (
      <IonIcon icon={personCircleOutline} />
    )
  ) : (
    <IonIcon icon={personCircleOutline} />
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
          <IonButton fill="clear" slot="end" onClick={togglePopover}>
            <IonChip>
              {avatarElement}
              <IonLabel>{label}</IonLabel>
              <IonText>({accountType})</IonText>
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
          <><div>
            <IonTitle>Welcome {username}</IonTitle>
          </div><div className="location-button-container">
              <IonButton onClick={getLocation}>Get Current Location</IonButton>
            </div></>
        )}
        {isLoaded && showMap && (
          <LoadMap
            mapCenter={mapCenter}
            isAnonymous={isAnonymous}
            user={user}
            navigate={navigate}
          />
        )}

      </IonContent>
    </IonPage>
  );
};

export default Map;

