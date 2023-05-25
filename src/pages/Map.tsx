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
  IonRow,
  IonGrid,
  IonCol,
  IonToolbar,
  IonAvatar,
  IonChip,
  IonSegment,
  IonSegmentButton,
  IonButtons,
  IonItem,
  IonModal,
  IonTitle,
  IonDatetime,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { useEffect, useCallback, useState, useContext } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { query, ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { Query, doc, getDoc, getDocs, updateDoc, where } from "firebase/firestore";
import { useHistory } from "react-router-dom";
import { locationOutline, personCircleOutline, playOutline } from "ionicons/icons";
import useBikeBusGroup from "../components/useBikeBusGroup";
import { GoogleMap, Marker, useJsApiLoader, DistanceMatrixService } from "@react-google-maps/api";
import AnonymousAvatarMapMarker from "../components/AnonymousAvatarMapMarker";
import AvatarMapMarker from "../components/AvatarMapMarker";
import { HeaderContext } from "../components/HeaderContext";
import { StandaloneSearchBox } from "@react-google-maps/api";
import React from "react";
import Avatar from "../components/Avatar";
import { useAvatar } from "../components/useAvatar";
import { addDoc, collection } from 'firebase/firestore';




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
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  const [showGetDirectionsButton, setShowGetDirectionsButton] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.SearchBox | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });
  const [mapZoom, setMapZoom] = useState(15);
  const [newMapCenter, setNewMapCenter] = useState({ lat: 38, lng: -121 });
  const [getLocationClicked, setGetLocationClicked] = useState(false);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const { avatarUrl } = useAvatar(user?.uid);
  const [travelMode, setTravelMode] = useState<string>('');
  const [travelModeSelector, setTravelModeSelector] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [startTrip, setStartTrip] = useState<boolean>(false);
  const [endTrip, setEndTrip] = useState<boolean>(false);
  const [routeName, setRouteName] = useState<string>('');
  const [routeDescription, setRouteDescription] = useState<string>('');
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [routeDuration, setRouteDuration] = useState<string>('');
  const [routeStartLocation, setRouteStartLocation] = useState<string>('');
  const [routeTypeSelector, setRouteTypeSelector] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [routeType, setRouteType] = useState('');
  const [scheduleName, setScheduleName] = useState<string>('');
  const [scheduleDescription, setScheduleDescription] = useState<string>('');
  const [scheduleStartDate, setScheduleStartDate] = useState<string>('');
  const [scheduleEndDate, setScheduleEndDate] = useState<string>('');
  const [scheduleStartTime, setScheduleStartTime] = useState<string>('');
  const [scheduleEndTime, setScheduleEndTime] = useState<string>('');
  const [scheduleTypeSelector, setScheduleTypeSelector] = useState<string>('');
  const [scheduleFrequency, setScheduleFrequency] = useState<string>('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([{ scheduleStartTime: '', scheduleEndTime: '', frequency: '' }]);
  const [routeId, setRouteId] = useState<string | null>(null);





  type Schedule = {
    scheduleStartTime: string;
    scheduleEndTime: string;
    frequency: string;
    [key: string]: string;
};



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
      setMapZoom(15);
    } else if (userLocation) {
      setMapCenter(userLocation);
    } else if (selectedLocation) {
      setMapCenter(selectedLocation);
    }
  }, [userLocation, selectedLocation]);


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


  useEffect(() => {
    console.log("Google Maps script loaded: ", isLoaded);
    console.log("Google Maps load error: ", loadError);
  }, [isLoaded, loadError]);

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



  const getDirections = () => {
    if (userLocation && selectedLocation) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(mapRef.current);
      directionsService.route(
        {
          origin: userLocation,
          destination: selectedLocation,
          travelMode: google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode]
        },
        (response, status) => {
          if (status === "OK") {
            directionsRenderer.setDirections(response);
          } else {
            console.error("Directions request failed due to " + status);
          }
        }
      );
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [userLocation],
          destinations: [selectedLocation],
          //there's a user selected segment where they can choose the travelmodeSelector. This is where we will set the travel mode.
          travelMode: google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode]
        },
        (response, status) => {
          if (status === "OK" && response?.rows[0]?.elements[0]?.status === "OK") {
            const distance = response?.rows[0]?.elements[0]?.distance?.value;
            const duration = response?.rows[0]?.elements[0]?.duration?.value;
            console.log("Distance Matrix Response: ", response);
            // make the distance value a string with 2 decimal places in miles (convert from meters), then display it on the screen
            setDistance(
              (Math.round((distance * 0.000621371192) * 100) / 100).toString()
            );
            // make the duration value a string with 2 decimal places in minutes (convert from seconds), then display it on the screen
            setDuration(
              (Math.round((duration * 0.0166667) * 100) / 100).toString()
            );
            // calculate the estimated arrival time by adding the duration to the current time
            const arrivalTime = new Date();
            const durationInMinutes = duration / 60;
            arrivalTime.setMinutes(arrivalTime.getMinutes() + durationInMinutes);
            setArrivalTime(arrivalTime.toLocaleTimeString());
          } else {
            console.error("Error calculating distance:", status);
          }
        }
      );
    }
  };

  const createRoute = () => {
    if (userLocation && selectedLocation) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(mapRef.current);
      directionsService.route(
        {
          origin: userLocation,
          destination: selectedLocation,
          travelMode: google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode]
        },
        (response, status) => {
          if (status === "OK") {
            directionsRenderer.setDirections(response);
            const route = response?.routes[0];
            const routeData = {
              distance: route?.legs[0]?.distance?.value,
              duration: route?.legs[0]?.duration?.value,
              arrivalTime: new Date(),
              travelMode: travelModeSelector,
              origin: {
                lat: route?.legs[0]?.start_location?.lat(),
                lng: route?.legs[0]?.start_location?.lng()
              },
              destination: {
                lat: route?.legs[0]?.end_location?.lat(),
                lng: route?.legs[0]?.end_location?.lng()
              }
            };
            console.log("Route Data: ", routeData);
            handleCreateRouteSubmit();
          } else {
            console.error("Directions request failed due to " + status);
          }
        }
      );
    }
  };


  const handleCreateRouteSubmit = async () => {
    try {
      // Store the DocumentReference returned by addDoc in a variable
      const routeDocRef = await addDoc(collection(db, 'routes'), {
        routeName: routeName,
        description: routeDescription,
        startPoint: userLocation,
        endPoint: selectedLocation,
        routeType: routeType,
        accountType: accountType,
        travelMode: travelModeSelector,
        routeCreator: "/users/" + user?.uid,
        routeLeader: "/users/" + user?.uid,
      });
  
      // go to the /view route page
      history.push(`/view-route/${routeDocRef.id}`);
    } catch (error) {
      console.log("Error: ", error);
    }
  };
  
  
  

  if (!isLoaded) {
    return <div>Loading...</div>;
  }


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {headerContext?.showHeader && <IonHeader></IonHeader>}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {!showMap && (
          <>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <div className="location-button-container">
                    <IonButton onClick={getLocation}>Start Map by retrieving your Current Location</IonButton>
                  </div>
                </IonCol>
              </IonRow>
              <IonRow>
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
              </IonRow>
            </IonGrid>

          </>
        )}
        {showMap && (
          <IonGrid fixed={false}>
            <IonRow className="map-base">
              <GoogleMap
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                mapContainerStyle={{
                  width: "100%",
                  height: "100%",
                }}
                center={mapCenter}
                zoom={18}
                options={{
                  disableDefaultUI: true,
                  zoomControl: false,
                  mapTypeControl: false,
                  disableDoubleClickZoom: true,
                  maxZoom: 18,
                }}
              >
                <IonGrid className="search-container">
                  <IonRow className="current-location">
                    <IonCol>
                      <IonLabel>Current Location:{avatarElement}</IonLabel>
                      <IonLabel>Travel Mode:</IonLabel>
                      <IonSegment value={travelModeSelector} onIonChange={(e: CustomEvent) => {
                        setTravelMode(e.detail.value);
                        setTravelModeSelector(e.detail.value);
                      }}>
                        <IonSegmentButton value="WALKING">
                          <IonLabel>Walking</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="BICYCLING">
                          <IonLabel>Bicycling</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="DRIVING">
                          <IonLabel>Driving</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="TRANSIT">
                          <IonLabel>Transit</IonLabel>
                        </IonSegmentButton>
                      </IonSegment>
                    </IonCol>
                    <IonCol className="Destination-box">
                      <IonLabel>Destination:</IonLabel>
                      <StandaloneSearchBox
                        onLoad={onLoad}
                        onPlacesChanged={onPlaceChanged}
                      >
                        <input
                          type="text"
                          placeholder="Enter a Destination"
                          style={{
                          }}
                        />
                      </StandaloneSearchBox>
                      {showGetDirectionsButton && <IonButton onClick={getDirections}>Get Directions</IonButton>}
                      <IonButton onClick={() => setShowModal(true)}>Create Route</IonButton>
                      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                        <IonHeader>
                          <IonToolbar>
                            <IonTitle>Create Route</IonTitle>
                            <IonButtons slot="end">
                              <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
                            </IonButtons>
                          </IonToolbar>
                        </IonHeader>
                        <IonContent>
                          <IonItem>
                            <IonLabel position="floating">Route Name</IonLabel>
                            <IonInput value={routeName} onIonChange={e => setRouteName(e.detail.value || '')}></IonInput>
                          </IonItem>
                          <IonItem>
                            <IonLabel position="floating">Route Description</IonLabel>
                            <IonInput value={routeDescription} onIonChange={e => setRouteDescription(e.detail.value || '')}></IonInput>
                          </IonItem>
                          <IonText>Travel Mode</IonText>
                          <IonItem>
                            <IonSegment value={travelMode} onIonChange={(e: CustomEvent) => setTravelMode(e.detail.value || '')}>
                              <IonSegmentButton value="BICYCLING">
                                <IonLabel>Bicycling</IonLabel>
                              </IonSegmentButton>
                              <IonSegmentButton value="DRIVING">
                                <IonLabel>Driving</IonLabel>
                              </IonSegmentButton>
                              <IonSegmentButton value="WALKING">
                                <IonLabel>Walking</IonLabel>
                              </IonSegmentButton>
                            </IonSegment>
                          </IonItem>
                          <IonText>Route Type</IonText>
                          <IonItem>
                            <IonSegment value={routeType} onIonChange={(e: CustomEvent) => setRouteType(e.detail.value || '')}>
                              <IonSegmentButton value="school">
                                <IonLabel>School</IonLabel>
                              </IonSegmentButton>
                              <IonSegmentButton value="work">
                                <IonLabel>Work</IonLabel>
                              </IonSegmentButton>
                              <IonSegmentButton value="club">
                                <IonLabel>Club</IonLabel>
                              </IonSegmentButton>
                            </IonSegment>
                          </IonItem>
                          <IonButton expand="full" onClick={handleCreateRouteSubmit}>Submit</IonButton>
                        </IonContent>
                      </IonModal>
                    </IonCol>
                    <IonCol>
                      <IonRow>
                        <IonLabel>Distance: {distance} miles </IonLabel>
                        <IonLabel>Estimated Time of Trip: {duration} minutes</IonLabel>
                        <IonLabel>Estimated Time of Arrival: {arrivalTime}</IonLabel>
                        <IonRow className="map-directions-after-get">
                          <IonCol>
                            <IonLabel>Directions:</IonLabel>
                          </IonCol>
                        </IonRow>
                      </IonRow>
                    </IonCol>
                  </IonRow>
                </IonGrid>
                <div>
                  {user && isAnonymous && userLocation && <AnonymousAvatarMapMarker position={userLocation} uid={user.uid} />}
                  {user && !isAnonymous && userLocation && <AvatarMapMarker uid={user.uid} position={userLocation} />}
                </div>
                <div>
                  {selectedLocation && <Marker position={selectedLocation} />}
                </div>
              </GoogleMap>
            </IonRow>
          </IonGrid>
        )}
        <IonRow>
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
        </IonRow>

      </IonContent>
    </IonPage>
  );
};

export default Map;
