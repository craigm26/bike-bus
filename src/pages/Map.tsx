import {
  IonContent,
  IonHeader,
  IonPage,
  IonButton,
  IonActionSheet,
  IonFab,
  IonIcon,
  IonText,
  IonInput,
  IonLabel,
} from "@ionic/react";
import { useEffect, useCallback, useState, useContext } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useHistory } from "react-router-dom";
import { locationOutline, playOutline } from "ionicons/icons";
import useBikeBusGroup from "../components/useBikeBusGroup";
import { GoogleMap, Marker, useJsApiLoader, DistanceMatrixService } from "@react-google-maps/api";
import AnonymousAvatarMapMarker from "../components/AnonymousAvatarMapMarker";
import AvatarMapMarker from "../components/AvatarMapMarker";
import { HeaderContext } from "../components/HeaderContext";
import { StandaloneSearchBox } from "@react-google-maps/api";
import React from "react";



const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

const DEFAULT_ACCOUNT_MODES = ["Member"];

const Map: React.FC = () => {
  const { user, isAnonymous } = useAuth();
  const { fetchedGroups, loading: loadingGroups, error } = useBikeBusGroup();
  const history = useHistory();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
  const [username, setUsername] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const headerContext = useContext(HeaderContext);
  const [showCreateRouteButton, setShowCreateRouteButton] = useState(false);
  const [showGetDirectionsButton, setShowGetDirectionsButton] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.SearchBox | null>(null);
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });
  const [mapZoom, setMapZoom] = useState(15);
  const [newMapCenter, setNewMapCenter] = useState({ lat: 38, lng: -121 });
  const [getLocationClicked, setGetLocationClicked] = useState(false);
  const mapRef = React.useRef<google.maps.Map | null>(null);



  useEffect(() => {
    if (headerContext) {
      headerContext.setShowHeader(true); // Hide the header for false, Show the header for true (default)
    }
  }, [headerContext]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  const getLocation = () => {
    setGetLocationClicked(true);
    setShowMap(true);
    setMapCenter(userLocation);
    watchLocation();
  };

  const watchLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLocation);
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
          setUserLocation(newMapCenter); // Update setUserLocation with newMapCenter

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

  useEffect(() => {
    console.log("MapCenter Location: ", mapCenter);
    console.log("User Location: ", userLocation)
    console.log("Selected Location: ", selectedLocation);
  }, [mapCenter, selectedLocation, userLocation]);

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
    if (user && getLocationClicked) {
      watchLocation();
    }
  }, [user, getLocationClicked, watchLocation]);

  //update map center when user location changes or selected location changes. When both have changed, set map center to show both locations on the map. Also set the zoom to fit both markers.
  useEffect(() => {
    if (userLocation && selectedLocation) {
      setMapCenter({
        lat: (userLocation.lat + selectedLocation.lat) / 2,
        lng: (userLocation.lng + selectedLocation.lng) / 2,
      });
    } else if (userLocation) {
      setMapCenter(userLocation);
    } else if (selectedLocation) {
      setMapCenter(selectedLocation);
    }
  }, [userLocation, selectedLocation]);

  useEffect(() => {
    if (userLocation && selectedLocation) {
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [userLocation],
          destinations: [selectedLocation],
          travelMode: google.maps.TravelMode.BICYCLING,
        },
        (response, status) => {
          if (status === "OK" && response?.rows[0]?.elements[0]?.status === "OK") {
            const distance = response?.rows[0]?.elements[0]?.distance?.value;
            if (distance !== undefined) {
              if (distance < 100) {
                setMapZoom(15);
              } else if (distance < 500) {
                setMapZoom(14);
              } else if (distance < 1000) {
                setMapZoom(13);
              } else if (distance < 2000) {
                setMapZoom(12);
              } else if (distance < 5000) {
                setMapZoom(11);
              } else if (distance < 10000) {
                setMapZoom(10);
              } else if (distance < 20000) {
                setMapZoom(9);
              } else if (distance < 50000) {
                setMapZoom(8);
              } else if (distance < 100000) {
                setMapZoom(7);
              } else if (distance < 200000) {
                setMapZoom(6);
              } else if (distance < 500000) {
                setMapZoom(5);
              } else if (distance < 1000000) {
                setMapZoom(4);
              } else if (distance < 2000000) {
                setMapZoom(3);
              } else if (distance < 5000000) {
                setMapZoom(2);
              } else if (distance < 10000000) {
                setMapZoom(1);
              } else {
                setMapZoom(0);
              }
            }
            console.log("Distance Matrix Response: ", response);
          } else {
            console.error("Error calculating distance:", status);
          }
        }
      );
    } else if (userLocation) {
      setMapZoom(15);
    } else if (selectedLocation) {
      setMapZoom(15);
    }
  }, [userLocation, selectedLocation]);




  useEffect(() => {
    console.log("Google Maps script loaded: ", isLoaded);
    console.log("Google Maps load error: ", loadError);
  }, [isLoaded, loadError]);

  const navigate = useCallback((path: string) => {
    history.push(path);
  }, [history]);

  const onLoad = (ref: google.maps.places.SearchBox) => {
    setAutocomplete(ref);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const places = autocomplete.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          // update selected location instead of map center
          setSelectedLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
          setShowCreateRouteButton(true);
          setShowGetDirectionsButton(true);
        }
      }
    }
  };

  // when someone clicks on the setShowGetDirectionsButton, the Google Directions Service should use hthe user's current location and the selected location to get directions and display them on the map
  const getDirections = () => {
    if (userLocation && selectedLocation) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(mapRef.current);
      directionsService.route(
        {
          origin: userLocation,
          destination: selectedLocation,
          travelMode: google.maps.TravelMode.BICYCLING,
        },
        (response, status) => {
          if (status === "OK") {
            directionsRenderer.setDirections(response);
          } else {
            console.error("Directions request failed due to " + status);
          }
        }
      );
    }
  };

  return (
    <IonPage>
      {headerContext?.showHeader && <IonHeader></IonHeader>}
      <IonContent>
        {!showMap && (
          <>
            <div className="map-welcome-container"></div>
            <div className="location-button-container">
              <IonButton onClick={getLocation}>Start Map by retrieving your Current Location</IonButton>
            </div>
          </>
        )}
        {showMap && (
          <GoogleMap
            onLoad={(map) => {
              mapRef.current = map;
            }}
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
            <div>
              {user && isAnonymous && <AnonymousAvatarMapMarker position={userLocation} uid={user.uid} />}
              {user && !isAnonymous && <AvatarMapMarker uid={user.uid} position={userLocation} />}
            </div>
            <div>
              {selectedLocation && <Marker position={selectedLocation} />}
            </div>
            <IonInput>
                  <IonIcon icon={locationOutline} />
                  <IonLabel>Current Location:</IonLabel>
                  <IonText>{userLocation ? `${userLocation.lat}, ${userLocation.lng}` : "No location found"}</IonText>
                </IonInput>
            <div className="search-bar">
              <StandaloneSearchBox
                onLoad={onLoad}
                onPlacesChanged={onPlaceChanged}
              >
                <input
                  type="text"
                  placeholder="Enter a location"
                  style={{
                  }}
                />
              </StandaloneSearchBox>
              <div className="location-action">
                <IonInput>
                  <IonIcon icon={locationOutline} />
                  <IonLabel>Current Location:</IonLabel>
                  <IonText>{userLocation ? `${userLocation.lat}, ${userLocation.lng}` : "No location found"}</IonText>
                </IonInput>
                {showGetDirectionsButton && <IonButton onClick={getDirections}>Get Directions</IonButton>}
                {showCreateRouteButton && <IonButton onClick={() => navigate('/createRoute')}>Create Route</IonButton>}
              </div>
            </div>
          </GoogleMap>
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
