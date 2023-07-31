import {
  IonContent,
  IonHeader,
  IonPage,
  IonButton,
  IonIcon,
  IonLabel,
  IonRow,
  IonGrid,
  IonCol,
  IonToolbar,
  IonAvatar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonItem,
  IonList,
  IonText,
  IonCardTitle,
  IonToggle,
} from "@ionic/react";
import { useEffect, useCallback, useState, useRef, useContext } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { DocumentSnapshot, Firestore, FirestoreError, QueryDocumentSnapshot, QuerySnapshot, arrayUnion, getDoc, query, doc, getDocs, onSnapshot, updateDoc, where } from "firebase/firestore";
import { useHistory } from "react-router-dom";
import { bicycleOutline, busOutline, businessOutline, carOutline, locateOutline, mapOutline, peopleOutline, personCircleOutline, walkOutline } from "ionicons/icons";
import { BicyclingLayer, GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import AnonymousAvatarMapMarker from "../components/AnonymousAvatarMapMarker";
import AvatarMapMarker from "../components/AvatarMapMarker";
import { HeaderContext } from "../components/HeaderContext";
import { StandaloneSearchBox } from "@react-google-maps/api";
import React from "react";
import Avatar from "../components/Avatar";
import { useAvatar } from "../components/useAvatar";
import { addDoc, collection } from 'firebase/firestore';
import {
  DocumentData,
  doc as firestoreDoc,
} from "firebase/firestore";

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

const DEFAULT_ACCOUNT_MODES = ["Member"];

const Map: React.FC = () => {
  const { user, isAnonymous } = useAuth();
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
  const [routeDescription, setRouteDescription] = useState<string>('');
  const [routeStartLocation, setRouteStartLocation] = useState<string>('');
  const [routeStartName, setRouteStartName] = useState<string>('');
  const [routeStartStreetName, setRouteStartStreetName] = useState<string>('');
  const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>('');
  const [routeEndName, setRouteEndName] = useState<string>('');
  const [routeEndStreetName, setRouteEndStreetName] = useState<string>('');
  const [routeEndFormattedAddress, setRouteEndFormattedAddress] = useState<string>('');
  const [routeType, setRouteType] = useState("SCHOOL");
  const [pathCoordinates, setPathCoordinates] = useState<{ latitude: number; longitude: number; }[]>([]);
  const [startPointAdress, setStartPointAdress] = useState<string>('');
  const [selectedEndLocationAddress, setSelectedEndLocationAddress] = useState<string>('');
  const [selectedStartLocationAddress, setSelectedStartLocationAddress] = useState<string>('');
  const [endPointAdress, setEndPointAdress] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userLocationAddress, setUserLocationAddress] = useState("Loading...");
  const [route, setRoute] = useState<DocumentData | null>(null);



  type Point = {
    lat: number;
    lng: number;
  };

  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [currentLocation, setCurrentLocation] = useState({ lat: null, lng: null });
  const [currentLocationRow, setCurrentLocationRow] = useState(true);
  const [destinationRow, setDestinationRow] = useState(false);
  const [directionsRow, setDirectionsRow] = useState(false);
  const [detailedDirectionsRow, setDetailedDirectionsRow] = useState(false);
  const [travelModeRow, setTravelModeRow] = useState(false);
  const [createRouteRow, setCreateRouteRow] = useState(false);
  const [directionsFetched, setDirectionsFetched] = useState(false);
  const [showCreateRouteModal, setCreateRouteShowModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [description, setDescription] = useState('');
  const [isBikeBus, setIsBikeBus] = useState(false);
  const polylinesRef = useRef([]); const [bikeBusEnabled, setBikeBusEnabled] = useState(false);
  const [routesEnabled, setRoutesEnabled] = useState(false);
  const [organizationsEnabled, setOrganizationsEnabled] = useState(false);
  const [openTripsEnabled, setOpenTripsEnabled] = useState(false);
  const [eventsEnabled, setEventsEnabled] = useState(false);
  const [bikeBusRoutes, setBikeBusRoutes] = useState<any[]>([]);
  const [infoWindow, setInfoWindow] = useState<{ isOpen: boolean, content: string, position: { lat: number, lng: number } | null }>
    ({ isOpen: false, content: '', position: null });


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
                setRouteStartFormattedAddress(`${results[0].formatted_address}` ?? '');
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
    if (user) {
      const userRef = firestoreDoc(db, "users", user.uid);
      const routesRef = collection(db, "routes");
      const queryObj = query(
        routesRef,
        where("isBikeBus", "==", true),

      );
      getDocs(queryObj)
        .then((querySnapshot) => {
          const routes: any[] = [];
          querySnapshot.forEach((doc) => {
            const routeData = doc.data();
            routes.push(routeData);
          });
          console.log("BikeBus Routes", routes);
          setBikeBusRoutes(routes);
          console.log("BikeBus Routes", bikeBusRoutes);
        })
        .catch((error) => {
          console.log("Error fetching bike/bus routes:", error);
        });

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
  }, [isLoaded, loadError]);



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
          // define place.address_components
          const addressComponents = place.address_components;
          // extract street name
          const streetName = addressComponents?.find(component =>
            component.types.includes('route')
          )?.long_name;

          setRouteStartStreetName(streetName ?? '');
          setRouteStartName(`${place.name}` ?? '');
          setRouteStartFormattedAddress(`${place.formatted_address}` ?? '');
        }
      }
    }
  };

  const onLoadStartingLocation = (ref: google.maps.places.SearchBox) => {
    setAutocompleteStart(ref);
    onPlaceChangedStart();
    // need to set startPointAddress to the address of the selected start point
    // need to set startPointName to the name of the selected start point

    setSelectedStartLocation({ lat: userLocation.lat, lng: userLocation.lng });
  };

  const onPlaceChangedDestination = () => {
    if (autocompleteEnd !== null) {
      const places = autocompleteEnd.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          setSelectedEndLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });

          // define place.address_components
          const addressComponents = place.address_components;
          // extract street name
          const streetName = addressComponents?.find(component =>
            component.types.includes('route')
          )?.long_name;

          setRouteEndStreetName(streetName ?? '');
          setRouteEndName(`${place.name}` ?? '');
          setRouteEndFormattedAddress(`${place.formatted_address}` ?? '');
          setShowCreateRouteButton(true);
          setShowGetDirectionsButton(true);

        }
      }
    }
  };

  interface LatLng {
    latitude: number;
    longitude: number;
  }

  function perpendicularDistance(point: LatLng, linePoint1: LatLng, linePoint2: LatLng): number {
    const { latitude: x, longitude: y } = point;
    const { latitude: x1, longitude: y1 } = linePoint1;
    const { latitude: x2, longitude: y2 } = linePoint2;

    const area = Math.abs(0.5 * (x1 * y2 + x2 * y + x * y1 - x2 * y1 - x * y2 - x1 * y));
    const bottom = Math.hypot(x1 - x2, y1 - y2);
    const height = (2 * area) / bottom;

    return height;
  }

  function ramerDouglasPeucker(pointList: LatLng[], epsilon: number): LatLng[] {
    let dmax = 0;
    let index = 0;
    const end = pointList.length - 1;

    for (let i = 1; i < end; i++) {
      const d = perpendicularDistance(pointList[i], pointList[0], pointList[end]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }

    if (dmax > epsilon) {
      const recResults1 = ramerDouglasPeucker(pointList.slice(0, index + 1), epsilon);
      const recResults2 = ramerDouglasPeucker(pointList.slice(index, end + 1), epsilon);

      const resultPoints = [...recResults1, ...recResults2.slice(1)];
      return resultPoints;
    } else {
      return [pointList[0], pointList[end]];
    }
  }

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

            const pathPoints: LatLng[] = response.routes[0].overview_path.map((latLng: any) => ({
              latitude: latLng.lat(),
              longitude: latLng.lng(),
            }));
            const epsilon = 0.0001;
            const simplifiedPathPoints = ramerDouglasPeucker(pathPoints, epsilon);
            setPathCoordinates(simplifiedPathPoints);
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
    setDirectionsFetched(true);

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
              routeName: `${routeStartName ? routeStartName + ' on ' : ''}${routeStartStreetName} to ${routeEndName ? routeEndName + ' on ' : ''}${routeEndStreetName}`,
              startPointName: routeStartName,
              startPointStreetName: routeStartStreetName,
              routeEndStreetName: routeEndStreetName,
              endPointName: routeEndName,
              routeDescription: description,
              pathCoordinates: pathCoordinates,
              isBikeBus: false,
            };
            console.log("Route Data: ", routeData);
            console.log("routeName: ", routeStartName + " to " + routeEndName);
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

      const convertedPathCoordinates = pathCoordinates.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude,
      }));

      const routeDocRef = await addDoc(collection(db, 'routes'), {
        routeName: `${routeStartName ? routeStartName + ' on ' : ''}${routeStartStreetName} to ${routeEndName ? routeEndName + ' on ' : ''}${routeEndStreetName}`,
        description: description,
        isBikeBus: false,
        BikeBusGroupId: "",
        startPoint: selectedStartLocation,
        endPoint: selectedEndLocation,
        routeType: routeType,
        duration: duration,
        accountType: accountType,
        travelMode: travelModeSelector,
        routeCreator: "/users/" + user?.uid,
        routeLeader: "/users/" + user?.uid,
        pathCoordinates: convertedPathCoordinates,
        startPointName: routeStartName,
        startPointAddress: routeStartFormattedAddress,
        endPointName: routeEndName,
        endPointAddress: routeEndFormattedAddress,
        distance: distance,
      });
      console.log("routeName: ", routeStartName + " to " + routeEndName);
      history.push(`/viewroute/${routeDocRef.id}`);
    } catch (error) {
      console.log("Error: ", error);
    }
  };


  const saveDestination = () => {
    if (user) {
      console.log("user is logged in");
      const userRef = doc(db, "users", user.uid);
      updateDoc(userRef, {
        savedDestinations: arrayUnion({
          name: routeEndName,
          address: routeEndFormattedAddress,
        }),
      }).then(() => {
        console.log("Destination successfully saved to your account!");
        // set the showSaveDestinationButton to false so that the user can't save the same destination multiple times
        // setShowSaveDestinationButton(false);
      });

    } else {
      console.log("user is not logged in");
      setShowLoginModal(true);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // when the bikebus button is clicked, show the bikebus routes on the map
  const handleBikeBusButtonClick = (routeId: string) => {
    const bikeBusGroup = bikeBusRoutes.find((route) => route.id === routeId);
    if (bikeBusGroup) {
      const bikeBusGroupName = bikeBusGroup.BikeBusName;
      const bikeBusGroupId = bikeBusGroup.BikeBusGroupId;
      const bikeBusGroupIdArray = bikeBusGroupId?.split("/");
      const bikeBusGroupIdString = bikeBusGroupIdArray?.[2];
      console.log("bikeBusGroupIdString: ", bikeBusGroupIdString);
      // Show an InfoWindow with the BikeBusGroup name
      const infoWindow = new google.maps.InfoWindow({
        content: `<div>${bikeBusGroupName}
            // link to the page for the corresponding bike/bus group
            <a href="/bikebusgrouppage/${bikeBusGroupIdString}">Go to Bike/Bus Group Page</a>
            </div>`,

      });
      infoWindow.open(mapRef.current, bikeBusGroupId);
      // Redirect to the page for the corresponding bike/bus group
      history.push(`/bikebusgrouppage/${bikeBusGroupIdString}`);
    }
  };

  const handleMarkerClick = (stop: any) => {
    console.log("handleMarkerClick called");
    console.log("stop: ", stop);
    const stopId = stop.id;
    const stopName = stop.name;
    const stopRoutes = stop.routes;
    const stopRoutesArray = stopRoutes?.split(",");
    const stopRoutesString = stopRoutesArray?.join(", ");
    console.log("stopRoutesString: ", stopRoutesString);
    // Show an InfoWindow with the stop name
    const infoWindow = new google.maps.InfoWindow({
      content: `<div>${stopName}
            <br>
            Routes: ${stopRoutesString}
            </div>`,
    });
    infoWindow.open(mapRef.current, stopId);
    // show the routes that stop at this stop and then show the next 3 arrival times for each route
    // get the routes that stop at this stop
    const stopRoutesArray2 = stopRoutes?.split(",");
    console.log("stopRoutesArray2: ", stopRoutesArray2);
    // get the routes that stop at this stop from firebase

  };

  const handleBikeBusRouteClick = (route: any) => {
    // Set content to whatever you want to display inside the InfoWindow
    const content = `<a href="/bikebusgrouppage/${route.BikeBusGroupId.id}" style="display: inline-block; padding: 10px; background-color: #ffd800; color: black; text-decoration: none;">
    View ${route.BikeBusName}
    </a>`

      ;

    // Set position to the startPoint of the route (or any other point you prefer)
    const position = route.startPoint;

    setInfoWindow({ isOpen: true, content, position });
  };

  const handleCloseClick = () => {
    setInfoWindow({ isOpen: false, content: '', position: null });
  };

  // when the user clicks on the "startTrip" action button, we want to create a new trip document in Firestore and use the current values for start and end locations as turn by turn google navigation - but only if it's not the browser. If it's the browser, then only allow user location to be tracked and the route is shown



  // when the user clicks on the "startBikeBusTrip" action button, we want to create a new trip document in Firestore and use the current values for start (users current location) and end (use the route in the bikbusgroup)  locations as turn by turn google directions

  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent>
        {!showMap && (
          <>
            <IonGrid className="location-app-intro-container">
              <IonRow>
                <IonCol>
                  <IonList lines="full">
                    <IonItem>
                      <IonLabel>
                        <IonCardTitle className="BikeBusFont">Welcome to BikeBus!</IonCardTitle>
                        <IonText>BikeBus is a group of people who want to bike together</IonText>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <IonText>Find, Create, and Join:</IonText>
                        <IonList>
                          <IonItem>
                            <IonIcon icon={mapOutline} slot="start" />
                            <IonLabel>Routes</IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonIcon icon={bicycleOutline} slot="start" />
                            <IonLabel>Open Trips</IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonIcon icon={peopleOutline} slot="start" />
                            <IonLabel>BikeBus Groups</IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonIcon icon={businessOutline} slot="start" />
                            <IonLabel>Organizations Near You</IonLabel>
                          </IonItem>
                        </IonList>
                      </IonLabel>
                    </IonItem>
                  </IonList>
                  <IonLabel>
                    <IonItem button color="primary" onClick={getLocation} lines="none">
                      <IonText color="secondary">Start Map</IonText>
                    </IonItem>
                    or Visit
                    <IonItem button color="primary" routerLink="/Help" lines="none">
                      <IonText color="secondary">Help</IonText>
                    </IonItem>
                  </IonLabel>
                </IonCol>
              </IonRow>
            </IonGrid>

          </>
        )
        }
        {
          showMap && (
            <IonGrid fixed={false} className="map-grid">
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
                  zoom={15}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                    mapTypeControl: false,
                    disableDoubleClickZoom: true,
                    maxZoom: 18,
                    styles: [
                      {
                        "elementType": "geometry",
                        "stylers": [
                          {
                            "color": "#f5f5f5"
                          }
                        ]
                      },
                      {
                        "elementType": "labels.icon",
                        "stylers": [
                          {
                            "visibility": "off"
                          }
                        ]
                      },
                      {
                        "elementType": "labels.text.fill",
                        "stylers": [
                          {
                            "color": "#616161"
                          }
                        ]
                      },
                      {
                        "elementType": "labels.text.stroke",
                        "stylers": [
                          {
                            "color": "#f5f5f5"
                          }
                        ]
                      },
                      {
                        "featureType": "administrative",
                        "elementType": "geometry",
                        "stylers": [
                          {
                            "visibility": "off"
                          }
                        ]
                      },
                      {
                        "featureType": "administrative.land_parcel",
                        "elementType": "labels",
                        "stylers": [
                          {
                            "visibility": "off"
                          }
                        ]
                      },
                      {
                        "featureType": "administrative.land_parcel",
                        "elementType": "labels.text.fill",
                        "stylers": [
                          {
                            "color": "#bdbdbd"
                          }
                        ]
                      },
                      {
                        "featureType": "administrative.neighborhood",
                        "elementType": "geometry.fill",
                        "stylers": [
                          {
                            "visibility": "off"
                          }
                        ]
                      },
                      {
                        "featureType": "administrative.neighborhood",
                        "elementType": "labels.text",
                        "stylers": [
                          {
                            "visibility": "off"
                          }
                        ]
                      },
                      {
                        "featureType": "poi",
                        "stylers": [
                          {
                            "visibility": "off"
                          }
                        ]
                      },
                      {
                        "featureType": "poi",
                        "elementType": "geometry",
                        "stylers": [
                          {
                            "color": "#eeeeee"
                          }
                        ]
                      },
                      {
                        "featureType": "poi",
                        "elementType": "labels.text",
                        "stylers": [
                          {
                            "visibility": "off"
                          }
                        ]
                      },
                      {
                        "featureType": "poi",
                        "elementType": "labels.text.fill",
                        "stylers": [
                          {
                            "color": "#757575"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.business",
                        "stylers": [
                          {
                            "visibility": "simplified"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.business",
                        "elementType": "labels.text",
                        "stylers": [
                          {
                            "saturation": -65
                          },
                          {
                            "lightness": 50
                          }
                        ]
                      },
                      {
                        "featureType": "poi.park",
                        "stylers": [
                          {
                            "visibility": "on"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.park",
                        "elementType": "geometry",
                        "stylers": [
                          {
                            "color": "#e5e5e5"
                          },
                          {
                            "visibility": "simplified"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.park",
                        "elementType": "geometry.fill",
                        "stylers": [
                          {
                            "color": "#27d349"
                          },
                          {
                            "visibility": "on"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.park",
                        "elementType": "labels",
                        "stylers": [
                          {
                            "visibility": "on"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.park",
                        "elementType": "labels.text",
                        "stylers": [
                          {
                            "visibility": "on"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.park",
                        "elementType": "labels.text.fill",
                        "stylers": [
                          {
                            "color": "#9e9e9e"
                          },
                          {
                            "saturation": 45
                          },
                          {
                            "lightness": -20
                          }
                        ]
                      },
                      {
                        "featureType": "poi.school",
                        "stylers": [
                          {
                            "visibility": "on"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.school",
                        "elementType": "geometry.fill",
                        "stylers": [
                          {
                            "color": "#ffd800"
                          },
                          {
                            "visibility": "on"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.school",
                        "elementType": "geometry.stroke",
                        "stylers": [
                          {
                            "visibility": "on"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.school",
                        "elementType": "labels",
                        "stylers": [
                          {
                            "visibility": "on"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.school",
                        "elementType": "labels.text",
                        "stylers": [
                          {
                            "visibility": "on"
                          }
                        ]
                      },
                      {
                        "featureType": "poi.school",
                        "elementType": "labels.text.fill",
                        "stylers": [
                          {
                            "visibility": "on"
                          },
                          {
                            "weight": 5
                          }
                        ]
                      },
                      {
                        "featureType": "poi.school",
                        "elementType": "labels.text.stroke",
                        "stylers": [
                          {
                            "visibility": "on"
                          },
                          {
                            "weight": 3.5
                          }
                        ]
                      },
                      {
                        "featureType": "road",
                        "elementType": "geometry",
                        "stylers": [
                          {
                            "color": "#ffffff"
                          },
                          {
                            "visibility": "simplified"
                          }
                        ]
                      },
                      {
                        "featureType": "road",
                        "elementType": "labels.icon",
                        "stylers": [
                          {
                            "visibility": "off"
                          }
                        ]
                      },
                      {
                        "featureType": "road.arterial",
                        "elementType": "labels.text.fill",
                        "stylers": [
                          {
                            "color": "#757575"
                          }
                        ]
                      },
                      {
                        "featureType": "road.highway",
                        "elementType": "geometry",
                        "stylers": [
                          {
                            "color": "#dadada"
                          }
                        ]
                      },
                      {
                        "featureType": "road.highway",
                        "elementType": "labels.text.fill",
                        "stylers": [
                          {
                            "color": "#616161"
                          }
                        ]
                      },
                      {
                        "featureType": "road.local",
                        "elementType": "labels",
                        "stylers": [
                          {
                            "visibility": "off"
                          }
                        ]
                      },
                      {
                        "featureType": "road.local",
                        "elementType": "labels.text.fill",
                        "stylers": [
                          {
                            "color": "#9e9e9e"
                          }
                        ]
                      },
                      {
                        "featureType": "transit",
                        "elementType": "geometry.fill",
                        "stylers": [
                          {
                            "color": "#7ea3ec"
                          },
                          {
                            "saturation": -50
                          },
                          {
                            "lightness": 50
                          },
                          {
                            "visibility": "on"
                          }
                        ]
                      },
                      {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [
                          {
                            "color": "#c9c9c9"
                          }
                        ]
                      },
                      {
                        "featureType": "water",
                        "elementType": "labels.text.fill",
                        "stylers": [
                          {
                            "color": "#9e9e9e"
                          }
                        ]
                      }
                    ],
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
                              width: "300px",
                              height: "40px",
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
                            width: "300px",
                            height: "40px",
                          }}
                        />
                      </StandaloneSearchBox>
                      {showGetDirectionsButton && !isAnonymous && <IonButton onClick={saveDestination}>Save as a Favorite Destination</IonButton>}
                      {showGetDirectionsButton && <IonRow className="travel-mode-row">
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
                      <IonRow>
                        <>
                          {showGetDirectionsButton && <IonButton expand="block" onClick={getDirections}>Get Directions</IonButton>}
                          {showGetDirectionsButton && directionsFetched && !isAnonymous && (

                            <IonButton expand="block" onClick={createRoute}>Create Route</IonButton>)
                          }

                        </>
                        {showGetDirectionsButton && directionsFetched && <IonButton expand="block" onClick={() => {
                          history.push(`/starttrip/${selectedStartLocationAddress}/${selectedEndLocationAddress}`);
                        }}>Start Trip</IonButton>}
                      </IonRow>
                    </IonCol>
                    <IonCol>
                      {showGetDirectionsButton && directionsFetched && <IonRow className="map-directions-after-get">
                        <IonLabel>Distance: {distance} miles </IonLabel>
                        <IonLabel>Estimated Time of Trip: {duration} minutes</IonLabel>
                        <IonLabel>Estimated Time of Arrival: {arrivalTime}</IonLabel>
                      </IonRow>}
                    </IonCol>
                  </IonGrid>
                  {bikeBusEnabled && bikeBusRoutes.map((route: any) => {
                    const keyPrefix = route.id || route.routeName;
                    return (
                      <div key={`${keyPrefix}`}>
                        <Polyline
                          key={`${keyPrefix}-border`}
                          path={route.pathCoordinates}
                          options={{
                            strokeColor: "#000000", // Border color
                            strokeOpacity: .7,
                            strokeWeight: 3, // Border thickness
                            clickable: true,
                            icons: [
                              {
                                icon: {
                                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                  strokeColor: "#000000", // Main line color
                                  strokeOpacity: .7,
                                  strokeWeight: 3,
                                  fillColor: "#000000",
                                  fillOpacity: .7,
                                  scale: 3,
                                },
                                offset: "100%",
                                repeat: "100px",
                              },
                            ],
                          }}
                          onClick={() => { handleBikeBusRouteClick(route) }}
                        />
                        {infoWindow.isOpen && infoWindow.position && (
                          <InfoWindow
                            position={infoWindow.position}
                            onCloseClick={handleCloseClick}
                          >
                            <div dangerouslySetInnerHTML={{ __html: infoWindow.content }} />
                          </InfoWindow>
                        )}
                        <Polyline
                          key={`${keyPrefix}-main`}
                          path={route.pathCoordinates}
                          options={{
                            strokeColor: "#ffd800", // Main line color
                            strokeOpacity: 1,
                            strokeWeight: 2,
                            icons: [
                              {
                                icon: {
                                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                  strokeColor: "#ffd800", // Main line color
                                  strokeOpacity: 1,
                                  strokeWeight: 2,
                                  fillColor: "#ffd800",
                                  fillOpacity: 1,
                                  scale: 3,
                                },
                                offset: "100%",
                                repeat: "100px",
                              },
                            ],
                          }}
                        />
                        {route.startPoint && (
                          <Marker
                            key={`${keyPrefix}-start`}
                            label={`Start of ${route.BikeBusName}`}
                            position={route.startPoint}
                            onClick={() => { handleBikeBusRouteClick(route) }}
                          />
                        )}
                        {route.endPoint && (
                          <Marker
                            key={`${keyPrefix}-end`}
                            label={`End of ${route.BikeBusName}`}
                            position={route.endPoint}
                            onClick={() => { handleBikeBusRouteClick(route) }}

                          />
                        )}
                      </div>
                    );
                  })}
                  <div>
                    {user && isAnonymous && userLocation && <AnonymousAvatarMapMarker position={userLocation} uid={user.uid} />}
                    {user && !isAnonymous && userLocation && <AvatarMapMarker uid={user.uid} position={userLocation} />}
                  </div>
                  <div>
                    {selectedStartLocation && <Marker position={selectedStartLocation} />}
                    {selectedEndLocation && <Marker position={selectedEndLocation} />}
                  </div>
                  <div>
                    <IonGrid className="toggle-bikebus-container">
                      <IonRow>
                        <IonCol>
                          <IonLabel>BikeBus</IonLabel>
                          <IonToggle checked={bikeBusEnabled} onIonChange={e => setBikeBusEnabled(e.detail.checked)} />
                        </IonCol>
                      </IonRow>
                    </IonGrid>
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
          )
        }

      </IonContent >
    </IonPage >
  );
};

export default Map;

