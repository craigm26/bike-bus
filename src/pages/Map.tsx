import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonButton,
  IonActionSheet,
  IonFab,
  IonIcon,
  IonText,
} from "@ionic/react";
import { useEffect, useCallback, useState } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useHistory } from "react-router-dom";
import { playOutline } from "ionicons/icons";
import useBikeBusGroup from "../components/useBikeBusGroup";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import SearchDestination from "../components/Mapping/SearchDestination";
import AnonymousAvatarMapMarker from "../components/AnonymousAvatarMapMarker";
import AvatarMapMarker from "../components/AvatarMapMarker";

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

const DEFAULT_ACCOUNT_MODES = ["Member"];

const Map: React.FC = () => {
  const { user, isAnonymous } = useAuth();
  const { fetchedGroups, loading: loadingGroups, error } = useBikeBusGroup();
  const history = useHistory();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [getLocationClicked, setGetLocationClicked] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
  const [username, setUsername] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setSelectedLocation(mapCenter);
  }, [mapCenter]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  // when the user consent to share location, the map will be shown
  useEffect(() => {
    if (getLocationClicked) {
      setShowMap(true);
    }
  }, [getLocationClicked]);


  const watchLocation = useCallback(() => {
    if (navigator.geolocation) {
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

      navigator.geolocation.watchPosition(
        (position) => {
          const newMapCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(newMapCenter);

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

    // when the user consents to share location, the map will be shown
    useEffect(() => {
      if (getLocationClicked) {
        setShowMap(true);
      }
    }, [getLocationClicked]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData) {
            if (userData.enabledAccountModes) {
              setEnabledAccountModes(userData.enabledAccountModes);
            } else {
              setEnabledAccountModes(DEFAULT_ACCOUNT_MODES);
              updateDoc(userRef, { enabledAccountModes: DEFAULT_ACCOUNT_MODES });
            }
            if (userData.username) {
              setUsername(userData.username);
            }
            if (userData.accountType) {
              setAccountType(userData.accountType);
            }
          }
        }
      });
    }
  }, [user]);

  useEffect(() => {
    console.log("MapCenter Location: ", mapCenter);
    console.log("Selected Location: ", selectedLocation);
  }, [mapCenter, selectedLocation]);

  useEffect(() => {
    if (user && getLocationClicked) {
      watchLocation();
    }
  }, [user, getLocationClicked, watchLocation]);

  const navigate = useCallback((path: string) => {
    history.push(path);
  }, [history]);

  useEffect(() => {
    console.log("Google Maps script loaded: ", isLoaded);
    console.log("Google Maps load error: ", loadError);
  }, [isLoaded, loadError]);

  useEffect(() => {
    if (user !== undefined && !loadingGroups) {
      setLoading(false);
    }
  }, [user, loadingGroups, error]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {!showMap ? (
          <>
            <div className="map-welcome-container"></div>
            <div className="location-button-container">
              <IonButton onClick={watchLocation}>Start Map by retrieving your Current Location</IonButton>
            </div>
          </>
        ) : loading ? (
          <div>Loading...</div>
        ) : (
          <div className="map-base">
            <GoogleMap
              mapContainerStyle={{
                width: "100%",
                height: "100%",
              }}
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
              <div className="search-bar">
                <SearchDestination currentLocation={mapCenter} navigate={navigate} />
              </div>
              {user && isAnonymous && <AnonymousAvatarMapMarker position={mapCenter} uid={user.uid} />}
              {user && !isAnonymous && <AvatarMapMarker uid={user.uid} position={mapCenter} />}
              {selectedLocation && <Marker position={selectedLocation} />}
            </GoogleMap>
          </div>
        )}
        <div className="bikebus-action-sheet footer-content">
          <div className="bikebusname-button-container">
            {fetchedGroups ? (
              fetchedGroups.map((group: any) => (
                <IonButton
                  shape="round"
                  size="large"
                  key={group.id}
                  routerLink={`/bikebusgrouppage/${group.id}`}
                  routerDirection="none"
                >
                  <IonText className="BikeBusFont">{group.BikeBusName}</IonText>
                </IonButton>
              ))
            ) : (
              <p>Loading groups...</p>
            )}
          </div>
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonButton className="bikebus-start-button" color="success" shape="round" size="large" id="open-action-sheet">
              <IonIcon size="large" icon={playOutline} />
            </IonButton>
          </IonFab>
          <IonActionSheet
            isOpen={showActionSheet}
            onDidDismiss={() => setShowActionSheet(false)}
            trigger="open-action-sheet"
            header="Start Actions:"
            buttons={[
              {
                text: "Start a Ride",
                role: "destructive",
                data: {
                  action: "startRide",
                },
              },
              {
                text: "Start a BikeBus Ride",
                data: {
                  action: "startBikeBusRide",
                },
              },
              {
                text: "Get Directions",
                data: {
                  action: "getDirections",
                },
              },
              {
                text: "Cancel",
                role: "cancel",
                data: {
                  action: "cancel",
                },
              },
            ]}
          ></IonActionSheet>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Map;
