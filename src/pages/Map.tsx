import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonButton,
  IonTitle,
} from "@ionic/react";
import { useState, useEffect, useCallback, useContext } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useHistory } from 'react-router-dom';
import LoadMap from "../components/Mapping/LoadMap";
import { HeaderContext } from "../components/HeaderContext";

const DEFAULT_ACCOUNT_MODES = ['Member'];



const Map: React.FC = () => {
  const { user, isAnonymous } = useAuth();
  const [accountType, setaccountType] = useState<string>('');
  const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
  const [username, setusername] = useState<string>('');
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });
  const [getLocationClicked, setGetLocationClicked] = useState(false);
  const headerContext = useContext(HeaderContext);

  useEffect(() => {
    if (headerContext) {
      headerContext.setShowHeader(true); // show header
    }
  }, [headerContext]);

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

  let label = user?.username ? user.username : "anonymous";

  if (!user) {
    label = "anonymous";
  }

  return (
    <IonPage>
      <IonContent fullscreen>
      {headerContext?.showHeader && (
        <IonHeader>
          <IonToolbar>
            </IonToolbar>
        </IonHeader>
      )}
        {!showMap && (
          <><div className="map-welcome-container">
            <IonTitle>Welcome {username}</IonTitle>
          </div><div className="location-button-container">
              <IonButton onClick={getLocation}>Start Map by retrieving your Current Location</IonButton>
            </div></>
        )}
        {showMap && (
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

