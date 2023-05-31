import {
  IonContent,
  IonHeader,
  IonPage,
  IonButton,
  IonActionSheet,
  IonFab,
  IonIcon,
  IonText,
  IonLabel,
  IonRow,
  IonGrid,
  IonCol,
  IonToolbar,
  IonAvatar,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { useEffect, useCallback, useState, useContext } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { useHistory } from "react-router-dom";
import { bicycleOutline, busOutline, carOutline, locateOutline, personCircleOutline, playOutline, walkOutline } from "ionicons/icons";
import useBikeBusGroup from "../components/useBikeBusGroup";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
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
  const [selectedStartLocation, setSelectedStartLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0, });;
  const [selectedEndLocation, setSelectedEndLocation] = useState<{ lat: number; lng: number } | null>(null);
  const headerContext = useContext(HeaderContext);
  const [showCreateRouteButton, setShowCreateRouteButton] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  const [showGetDirectionsButton, setShowGetDirectionsButton] = useState(false);
  const [autocompleteStart, setAutocompleteStart] = useState<google.maps.places.SearchBox | null>(null);
  const [autocompleteEnd, setAutocompleteEnd] = useState<google.maps.places.SearchBox | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });
  const [mapZoom, setMapZoom] = useState(15);
  const [getLocationClicked, setGetLocationClicked] = useState(false);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const { avatarUrl } = useAvatar(user?.uid);
  const [travelMode, setTravelMode] = useState<string>('');
  const [travelModeSelector, setTravelModeSelector] = useState<string>('BICYCLING');
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [routeName, setRouteName] = useState<string>('');
  const [routeDescription, setRouteDescription] = useState<string>('');
  const [routeStartLocation, setRouteStartLocation] = useState<string>('');
  const [routeStartName, setRouteStartName] = useState<string>('');
  const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>('');
  const [routeEndName, setRouteEndName] = useState<string>('');
  const [routeEndFormattedAddress, setRouteEndFormattedAddress] = useState<string>('');
  const [routeType, setRouteType] = useState("SCHOOL");
  const [pathCoordinates, setPathCoordinates] = useState<{ latitude: number; longitude: number; }[]>([]);
  const [startPointAdress, setStartPointAdress] = useState<string>('');
  const [selectedEndLocationAddress, setSelectedEndLocationAddress] = useState<string>('');
  const [selectedStartLocationAddress, setSelectedStartLocationAddress] = useState<string>('');
  const [endPointAdress, setEndPointAdress] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userLocationAddress, setUserLocationAddress] = useState<string>('');

  type Point = {
    lat: number;
    lng: number;
  };

  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [currentLocationRow, setCurrentLocationRow] = useState(true);
  const [destinationRow, setDestinationRow] = useState(false);
  const [directionsRow, setDirectionsRow] = useState(false);
  const [detailedDirectionsRow, setDetailedDirectionsRow] = useState(false);
  const [travelModeRow, setTravelModeRow] = useState(false);
  const [createRouteRow, setCreateRouteRow] = useState(false);


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
    onPlaceChangedStart();
    setCurrentLocationRow(false);
    setDestinationRow(true);
    setDirectionsRow(false);
    setCreateRouteRow(false);
    setDetailedDirectionsRow(false);
    setTravelModeRow(false);
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
          setMapCenter(userLocation);
          // Get user location address
          const geocoder = new google.maps.Geocoder();
          const latlng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK") {
              if (results && results[0]) {
                const userLocationAddress = `${results[0].formatted_address}`;
                setUserLocationAddress(userLocationAddress);
                const selectedStartLocation = { lat: userLocation.lat, lng: userLocation.lng };
                setSelectedStartLocation(selectedStartLocation);
              } else {
                window.alert("No results found");
              }
            } else {
              window.alert("Geocoder failed due to: " + status);
            }
          });
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
          setUserLocation(newMapCenter);
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
    console.log("User Location Address", userLocationAddress)
  }, [mapCenter, userLocation, userLocationAddress]);

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
    if (selectedStartLocation && selectedEndLocation) {
      setMapCenter({
        lat: (selectedEndLocation.lat),
        lng: (selectedEndLocation.lng),
      });
      setMapZoom(10);
    } else if (selectedStartLocation) {
      setMapCenter(selectedStartLocation);
    } else if (selectedEndLocation) {
      setMapCenter(selectedEndLocation);
    }
  }, [selectedStartLocation, selectedEndLocation]);


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

  const onLoadStartingLocation = (ref: google.maps.places.SearchBox) => {
    setAutocompleteStart(ref);
  };

  const onLoadDestinationValue = (ref: google.maps.places.SearchBox) => {
    setAutocompleteEnd(ref);
  };

  const onPlaceChangedStart = () => {
    console.log("onPlaceChangedStart called");
    if (autocompleteStart !== null) {
      const places = autocompleteStart.getPlaces();
      if (places && places.length > 0) {
        console.log("Places: ", places);
        const place = places[0];
        console.log("Place: ", place);
        if (place.geometry && place.geometry.location) {
          setSelectedStartLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
          setRouteStartName(`${place.name}` ?? '');
          setRouteStartFormattedAddress(`${place.formatted_address}` ?? '');
        }
      }
    }
  };

  console.log("Selected Start Location: ", selectedStartLocation);
  console.log("Selected End Location: ", selectedEndLocation);
  console.log("Route Start Name: ", routeStartName);
  console.log("Route Start Formatted Address: ", routeStartFormattedAddress);

  const onPlaceChangedDestination = () => {
    console.log("onPlaceChangedDestination called");
    if (autocompleteEnd !== null) {
      const places = autocompleteEnd.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        console.log("Place: ", place);
        if (place.geometry && place.geometry.location) {
          setSelectedEndLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
          setRouteEndName(`${place.name}` ?? '');
          setRouteEndFormattedAddress(`${place.formatted_address}` ?? '');
          setShowCreateRouteButton(true);
          setShowGetDirectionsButton(true);

        }
      }
    }
  };

  console.log("Route End Name: ", routeEndName);
  console.log("Route End Formatted Address: ", routeEndFormattedAddress);

  const getDirections = () => {
    if (selectedStartLocation && selectedEndLocation) {
      getEndPointAdress();
      getStartPointAdress();
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(mapRef.current);
      directionsService.route(
        {
          origin: selectedStartLocation,
          destination: selectedEndLocation,
          travelMode: google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode]
        },
        (response, status) => {
          if (status === "OK" && response) {
            directionsRenderer.setDirections(response);

            const pathPoints = response.routes[0].overview_path.map(latLng => ({
              latitude: latLng.lat(),
              longitude: latLng.lng(),
            }));
            setPathCoordinates(pathPoints);
          } else {
            console.error("Directions request failed due to " + status);
          }
        }
      );

      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [selectedStartLocation],
          destinations: [selectedEndLocation],
          travelMode: google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode]
        },
        (response, status) => {
          if (status === "OK" && response?.rows[0]?.elements[0]?.status === "OK") {
            const distance = response?.rows[0]?.elements[0]?.distance?.value;
            const duration = response?.rows[0]?.elements[0]?.duration?.value;
            console.log("Distance Matrix Response: ", response);

            setDistance(
              (Math.round((distance * 0.000621371192) * 100) / 100).toString()
            );

            setDuration(
              (Math.round((duration * 0.0166667) * 100) / 100).toString()
            );

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

  const getStartPointAdress = async () => {
    if (startPoint) {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${startPoint.lat},${startPoint.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      setSelectedStartLocationAddress(data.results[0].formatted_address);
    }
  };

  const getEndPointAdress = async () => {
    if (endPoint) {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${endPoint.lat},${endPoint.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      setSelectedEndLocationAddress(data.results[0].formatted_address);
    }
  };

  const createRoute = () => {
    if (selectedStartLocation && selectedEndLocation) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(mapRef.current);
      directionsService.route(
        {
          origin: selectedStartLocation,
          destination: selectedEndLocation,
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
              },
              startPointAddress: routeStartFormattedAddress,
              endPointAddress: routeEndFormattedAddress,
              startPoint: selectedStartLocation,
              endPoint: selectedEndLocation,
              routeDescription: routeDescription,
              pathCoordinates: pathCoordinates,
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
    getEndPointAdress();
    getStartPointAdress();
    try {
      const routeDocRef = await addDoc(collection(db, 'routes'), {
        routeName: routeName,
        description: routeDescription,
        startPoint: selectedStartLocation,
        endPoint: selectedEndLocation,
        routeType: routeType,
        accountType: accountType,
        travelMode: travelModeSelector,
        routeCreator: "/users/" + user?.uid,
        routeLeader: "/users/" + user?.uid,
        pathCoordinates: pathCoordinates,
        startPointName: routeStartName,
        startPointAddress: routeStartFormattedAddress,
        endPointName: routeEndName,
        endPointAddress: routeEndFormattedAddress,
        distance: distance,

      });
      history.push(`/editroute/${routeDocRef.id}`);
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const saveDestination = () => {
    if (user) {
      console.log("user is logged in");
      const userRef = doc(db, "users", user.uid);
      updateDoc(userRef, {
        savedDestinations: arrayUnion(setEndPointAdress)
      });
    } else {
      console.log("user is not logged in");
      setShowLoginModal(true);
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
                <IonCol className="location-button-container">
                  <IonButton onClick={getLocation}>Start Map by retrieving your Current Location</IonButton>
                </IonCol>
              </IonRow>
              <IonRow>
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
                    <IonButton onClick={getLocation}>
                      <IonIcon icon={locateOutline} />
                    </IonButton>
                    <IonCol>
                      <StandaloneSearchBox
                        onLoad={onLoadStartingLocation}
                        onPlacesChanged={onPlaceChangedStart}
                      >
                        <input
                          type="text"
                          autoComplete="on"
                          placeholder={userLocationAddress}
                          style={{
                          }}
                        />
                      </StandaloneSearchBox>
                    </IonCol>
                  </IonRow>
                  <IonCol className="destination-box">
                    <StandaloneSearchBox
                      onLoad={onLoadDestinationValue}
                      onPlacesChanged={onPlaceChangedDestination}
                    >
                      <input
                        type="text"
                        autoComplete="on"
                        placeholder="Enter a Destination"
                        style={{
                          width: "100%",
                        }}
                      />
                    </StandaloneSearchBox>
                    {showGetDirectionsButton && <IonRow className="travel-mode-row">"
                      <IonCol>
                        <IonLabel>Travel Mode:</IonLabel>
                        <IonSegment value={travelModeSelector} onIonChange={(e: CustomEvent) => {
                          setTravelMode(e.detail.value);
                          setTravelModeSelector(e.detail.value);
                        }}>
                          <IonSegmentButton value="WALKING">
                            <IonIcon icon={walkOutline} />
                          </IonSegmentButton>
                          <IonSegmentButton value="BICYCLING">
                            <IonIcon icon={bicycleOutline} />
                          </IonSegmentButton>
                          <IonSegmentButton value="DRIVING">
                            <IonIcon icon={carOutline} />
                          </IonSegmentButton>
                          <IonSegmentButton value="TRANSIT">
                            <IonIcon icon={busOutline} />
                          </IonSegmentButton>
                        </IonSegment>
                      </IonCol>
                    </IonRow>}
                    {showGetDirectionsButton && <IonButton onClick={getDirections}>Get Directions</IonButton>}
                    {showGetDirectionsButton && <IonButton onClick={createRoute}>Create Route</IonButton>}
                    {showGetDirectionsButton && <IonButton onClick={saveDestination}>Save as a Favorite Destination</IonButton>}
                  </IonCol>
                  <IonCol>
                    {showGetDirectionsButton && <IonRow className="map-directions-after-get">
                      <IonLabel>Distance: {distance} miles </IonLabel>
                      <IonLabel>Estimated Time of Trip: {duration} minutes</IonLabel>
                      <IonLabel>Estimated Time of Arrival: {arrivalTime}</IonLabel>
                    </IonRow>}
                  </IonCol>
                </IonGrid>
                <div>
                  {user && isAnonymous && userLocation && <AnonymousAvatarMapMarker position={userLocation} uid={user.uid} />}
                  {user && !isAnonymous && userLocation && <AvatarMapMarker uid={user.uid} position={userLocation} />}
                </div>
                <div>
                  {selectedStartLocation && <Marker position={selectedStartLocation} />}
                  {selectedEndLocation && <Marker position={selectedEndLocation} />}
                </div>
                <Polyline
                  path={pathCoordinates.map(coord => ({ lat: coord.latitude, lng: coord.longitude }))}
                  options={{
                    strokeColor: "#FF0000",
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    geodesic: true,
                    editable: true,
                    draggable: true,
                  }}
                />
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
                  text: "Start a Trip",
                  role: "destructive",
                  data: {
                    action: "startTrip",
                  },
                },
                {
                  text: "Start a BikeBus Trip",
                  data: {
                    action: "startBikeBusTrip",
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
