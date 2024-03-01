import {
  IonContent,
  IonPage,
  IonItem,
  IonInput,
  IonLabel,
  IonButton,
  IonTitle,
  IonSelect,
  IonSelectOption,
  IonCol,
  IonRow,
  IonGrid,
  IonHeader,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonText,
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { DocumentReference, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, StandaloneSearchBox, InfoWindow } from '@react-google-maps/api';
import React from 'react';
import { AuthContext } from '../AuthContext';
import { set } from 'date-fns';
import { use } from 'i18next';

const libraries: any = ["places", "drawing", "geometry", "localContext", "visualization"];

interface DistanceDurationResult {
  distance: string;
  duration: string;
  arrivalTime: string;
}

type DirectionsWaypoint = {
  location: google.maps.LatLng | google.maps.LatLngLiteral;
};


interface Coordinate {
  lat: number;
  lng: number;
}

interface BikeBusStops {
  id: string;
  StopId: string;
  BikeBusStopName: string;
  BikBusGroupId: DocumentReference;
  BikeBusRouteId: DocumentReference;
  lat: number;
  lng: number;
  BikeBusStopIds: DocumentReference[];
  BikeBusGroupId: string;
}

interface BikeBusStop {
  BikeBusStopName: string;
}

interface Route {
  newStop: Coordinate | null;
  oldIds: Coordinate | null;
  stopPoint: Coordinate | null;
  BikeBusStopIds: DocumentReference[];
  isBikeBus: boolean;
  BikeBusGroupId: string;
  id: string;
  accountType: string;
  description: string;
  endPoint: Coordinate;
  endPointAddress: string;
  endPointName: string;
  routeCreator: string;
  routeLeader: string;
  routeName: string;
  routeType: string;
  startPoint: Coordinate;
  startPointAddress: string;
  startPointName: string;
  travelMode: string;
  pathCoordinates: Coordinate[];
  bicyclingSpeed: string;
  bicyclingSpeedSelector: string;
  duration: string;
  distance: string;
}

interface RouteLeg {
  startPoint: Coordinate;
  endPoint: Coordinate;
  waypoints: Coordinate[]; // Intermediate BikeBus stops
  distance?: string;
  duration?: string;
}


const EditRoute: React.FC = () => {
  const { user, loadingAuthState } = useContext(AuthContext);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [selectedStartLocation, setSelectedStartLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0, });
  const [selectedEndLocation, setSelectedEndLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeStartName, setRouteStartName] = useState<string>('');
  const [routeEndName, setRouteEndName] = useState<string>('');
  const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>('');
  const [routeEndFormattedAddress, setRouteEndFormattedAddress] = useState<string>('');
  const [bikeBusStationsIds, setBikeBusStationsIds] = useState<Coordinate[]>([]);
  const [autocompleteStart, setAutocompleteStart] = useState<google.maps.places.SearchBox | null>(null);
  const [autocompleteEnd, setAutocompleteEnd] = useState<google.maps.places.SearchBox | null>(null);
  const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: startGeo.lat,
    lng: startGeo.lng,
  });

  const [BikeBusStops, setBikeBusStops] = useState<BikeBusStops[]>([]);
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const bikeBusStopsRef = getDoc(doc(db, 'bikebusstops', id));
  const bikeBusStopsQuery = bikeBusStopsRef;
  const [selectedStopIndex, setSelectedStopIndex] = React.useState<string | null>(null);
  const [bicyclingSpeed, setBicyclingSpeed] = useState<string>("");
  const [bicyclingSpeedSelector, setBicyclingSpeedSelector] = useState<string>("");
  const [travelModeSelector, setTravelModeSelector] = useState<string | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [pathCoordinates, setPathCoordinates] = useState<{ latitude: number; longitude: number; }[]>([]);
  const [directionsFetched, setDirectionsFetched] = useState(false);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const mapRef = React.useRef<google.maps.Map | null>(null);

  const onLoadDestinationValue = (ref: google.maps.places.SearchBox) => {
    setAutocompleteEnd(ref);
  };

  const containerMapStyle = {
    width: '100%',
    height: '100%',
  };

  const onLoadStartingLocation = (ref: google.maps.places.SearchBox) => {

    setAutocompleteStart(ref);
  };

  // if the field isbikeBus is set to true, then make the isBikeBus variable true
  const isBikeBus = selectedRoute?.isBikeBus ?? false;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  // when the map is loading, set startGeo to the route's startPoint
  useEffect(() => {
    if (selectedRoute) {
      setStartGeo(selectedRoute.startPoint);
      setEndGeo(selectedRoute.endPoint);
      setMapCenter(selectedRoute.startPoint);
      setEndGeo(selectedRoute.endPoint);
      setRouteStartFormattedAddress(selectedRoute.startPointAddress);
      setRouteEndFormattedAddress(selectedRoute.endPointAddress);
      setRouteStartName(selectedRoute.startPointName);
      setRouteEndName(selectedRoute.endPointName);
      setBicyclingSpeed(selectedRoute.bicyclingSpeed);
      setBicyclingSpeedSelector(selectedRoute.bicyclingSpeedSelector);
    }
  }
    , [selectedRoute]);

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
          // need to set startPointAddress to the address of the selected start point
          // need to set startPointName to the name of the selected start point

        }
      }
    }
  };

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

        }
      }
    }
  };

  useEffect(() => {
    const fetchSingleRoute = async (id: string) => {
      const docRef = doc(db, 'routes', id);

      // ensure the logged in user is the creator of the route
      if (user) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const routeData = docSnap.data() as Route;
          setSelectedRoute(routeData);
          console.log('routeData:', routeData);
          console.log('user:', user);
          console.log('user.uid:', user.uid);

          console.log('routeCreator:', routeData.routeCreator);
          if (routeData.routeCreator !== "/users/" + user.uid) {
            alert('You are not the creator of this route');
            history.push('/ViewRoute/' + id);
          }
        }
      }

    };

    if (id) fetchSingleRoute(id);
  }, [id]);


  useEffect(() => {

    if (isLoaded) {

      const fetchSingleRoute = async (id: string) => {
        const docRef = doc(db, 'routes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const routeData = {
            ...docSnap.data() as Route,
            id: docSnap.id,
            routeName: docSnap.data().routeName,
            startPoint: docSnap.data().startPoint,
            endPoint: docSnap.data().endPoint,
            BikeBusStopIds: (docSnap.data().BikeBusStopIds ?? []) as DocumentReference[],
            BikeBusGroupId: docSnap.data().BikeBusGroupId,
            pathCoordinates: docSnap.data().pathCoordinates,
            travelMode: docSnap.data().travelMode,
            bicyclingSpeed: docSnap.data().bicyclingSpeed,
            bicyclingSpeedSelector: docSnap.data().bicyclingSpeedSelector,
          };
          setSelectedRoute(routeData);
        }

      };
      fetchSingleRoute(id);

      if (selectedRoute?.BikeBusStopIds && selectedRoute.BikeBusStopIds.length > 0) {
        // let's fetch the bikebusstop data from the firestore document collection "bikebusstops" and store it in the state variable BikeBusStops
        const fetchBikeBusStops = async () => {
          // first let's get the bikebusstop ids from the selectedRoute
          const bikeBusStopIds = selectedRoute.BikeBusStopIds;
          // for each bikeBusStopId, let's create a query
          const bikeBusStopsQuery = query(collection(db, 'bikebusstops'), where('__name__', 'in', bikeBusStopIds));
          getDocs(bikeBusStopsQuery);
          // for each document, get the actual object document data and store it in the state variable BikeBusStops
          const bikeBusStopsSnapshot = await getDocs(bikeBusStopsQuery);
          const bikeBusStopsData = bikeBusStopsSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          })) as unknown as BikeBusStops[]; // this is the array of BikeBusStops
          setBikeBusStops(bikeBusStopsData);

        };

        if (selectedRoute) {
          setMapCenter({
            lat: (selectedRoute.startPoint.lat + selectedRoute.endPoint.lat) / 2,
            lng: (selectedRoute.startPoint.lng + selectedRoute.endPoint.lng) / 2,
          });
        }

        if (selectedStartLocation) {
          setStartGeo(selectedStartLocation);
          setMapCenter(selectedStartLocation);
        }

        if (selectedEndLocation) {
          setEndGeo(selectedEndLocation);
        }

        fetchBikeBusStops();
      }

    }

  }
    , [selectedStartLocation, selectedEndLocation]);

  function perpendicularDistance(point: Coordinate, linePoint1: Coordinate, linePoint2: Coordinate): number {
    const { lat: x, lng: y } = point;
    const { lat: x1, lng: y1 } = linePoint1;
    const { lat: x2, lng: y2 } = linePoint2;

    const area = Math.abs(0.5 * (x1 * y2 + x2 * y + x * y1 - x2 * y1 - x * y2 - x1 * y));
    const bottom = Math.hypot(x1 - x2, y1 - y2);
    const height = (2 * area) / bottom;

    return height;
  }

  function ramerDouglasPeucker(pointList: Coordinate[], epsilon: number): Coordinate[] {
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

  //calculate route without legs
  const calculateRoute = async (
    startPoint: Coordinate,
    endPoint: Coordinate,
    waypoints: google.maps.DirectionsWaypoint[],
    travelMode: google.maps.TravelMode,
    // we also need to add the bicycle speed
    bicyclingSpeed: number,
  ): Promise<{ pathCoordinates: { lat: number; lng: number; }[]; distance: string; duration: string }> => {



    const directionsService = new google.maps.DirectionsService();
    let totalDistance = 0; // in meters
    let totalDuration = 0; // in seconds

    const request = {
      origin: startPoint,
      destination: endPoint,
      waypoints: waypoints,
      travelMode: travelMode,
    };

    if (!startPoint || !endPoint) {
      console.warn("Missing startPoint or endPoint!");
      throw new Error("Missing startPoint or endPoint!");
    }
    console.log('startPoint: ', startPoint);
    console.log('endPoint: ', endPoint);
    // now inspect the type that is returned from startPoint and endPoint
    console.log('typeof startPoint: ', typeof startPoint);
    console.log('typeof endPoint: ', typeof endPoint);

    const batchSize = 10;
    const batches = [];
    const epsilon = 0.00005; // Define epsilon for Douglas-Peucker algorithm. Distance in degrees. 0.00005 is about 5.5 meters.
    const routeRequests = [];
    console.log('pathCoordinates: ', selectedRoute?.pathCoordinates);
    console.log('waypoints: ', waypoints);

    for (let i = 0; i < waypoints.length; i += batchSize) {
      console.log('i: ', i)
      const batch: google.maps.DirectionsWaypoint[] = waypoints.slice(i, Math.min(i + batchSize, waypoints.length));
      console.log('batch: ', batch)
      if (i !== 0) {
        batch.unshift(waypoints[i - 1]);
        console.log('batch: ', batch)
      }
      if (i + batchSize < waypoints.length) {
        batch.push(waypoints[i + batchSize]);
        console.log('batch: ', batch)
      }
      batches.push(batch);
      console.log('batches: ', batches)
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const origin = batch.length > 0 ? batch[0].location : undefined;
      const destination = batch.length > 0 ? batch[batch.length - 1].location : undefined;

      if (!origin || !destination) {
        console.warn("Origin or Destination is missing in batch!");
        return {
          pathCoordinates: [],
          distance: "0",
          duration: "0",
        };
      }

      // Modified slicing logic
      const batchWaypoints = batch.length <= 2 ? batch : batch.slice(1, batch.length - 1);

      console.log('batchWaypoints: ', batchWaypoints);

      // Debugging for empty array
      if (batchWaypoints.length === 0) {
        console.warn("batchWaypoints is empty!");
      }
      // deeply inspect the batchWaypoints array
      console.log('batchWaypoints[0]: ', batchWaypoints[0]);
      if (origin && destination) {
        // If batchWaypoints is empty, it will just route from origin to destination
        routeRequests.push(new Promise<Coordinate[]>((resolve, reject) => {
          directionsService.route({
            origin: startPoint,
            destination: endPoint,
            waypoints: batchWaypoints,
            optimizeWaypoints: false,
            travelMode: travelMode,
          }, (response: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
            if (status === google.maps.DirectionsStatus.OK && response) {
              const newRoute = response.routes[0];
              let newRoutePathCoordinates = newRoute.overview_path.map(coord => ({ lat: coord.lat(), lng: coord.lng() }));
              newRoutePathCoordinates = ramerDouglasPeucker(newRoutePathCoordinates, epsilon);
              resolve(newRoutePathCoordinates);
              console.log('newRoutePathCoordinates: ', newRoutePathCoordinates);
              // log the response and status from the directionsService.route
              console.log('response: ', response);
            } else {
              reject('Directions request failed due to ' + status);
            }
          });
        }));
      }

      // we have to figure out how to get the distance and duration for the new route
      // we can use the same function calculateDistanceAndDuration
      // we can also use the same function getDirectionsAndSimplifyRoute

    }


    const calculateRouteLegs = async (startPoint: Coordinate, endPoint: Coordinate, bikeBusStops: BikeBusStops[]) => {
      let legs: RouteLeg[] = [];
      let currentStart = startPoint;

      for (let i = 0; i <= bikeBusStops.length; i++) {
        const currentEnd = i < bikeBusStops.length ? { lat: bikeBusStops[i].lat, lng: bikeBusStops[i].lng } : endPoint;
        const leg: RouteLeg = {
          startPoint: currentStart,
          endPoint: currentEnd,
          waypoints: [], // Add waypoints if needed
        };
        // Calculate distance and duration for the leg
        const { pathCoordinates, distance, duration } = await calculateRoute(currentStart, currentEnd, [], travelMode, bicyclingSpeed);
        leg.distance = distance;
        leg.duration = duration;

        legs.push(leg);
        currentStart = currentEnd;
      }

      return legs;
    };

    try {
      const { routes } = await directionsService.route(request);
      const route = routes[0];
      route.legs.forEach(leg => {
        if (leg.distance && leg.duration) {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        }
      });

      // Convert to desired units if necessary
      const distanceInMiles = totalDistance / 1609.34; // meters to miles
      const durationInMinutes = totalDuration / 60; // seconds to minutes

      return {
        pathCoordinates: route.overview_path.map(coord => ({ lat: coord.lat(), lng: coord.lng() })),
        distance: distanceInMiles.toFixed(2), // rounded to 2 decimal places
        duration: durationInMinutes.toFixed(2), // rounded to 2 decimal places
      };
    } catch (error) {
      console.error("Failed to calculate route:", error);
      return {
        pathCoordinates: [], // Default value if route calculation fails
        distance: "0",       // Default value
        duration: "0",       // Default value
      };
    }

  }

  const calculateRouteLegs = async (startPoint: Coordinate, endPoint: Coordinate, bikeBusStops: BikeBusStops[]) => {
    let legs: RouteLeg[] = [];
    let currentStart = startPoint;

    for (let i = 0; i <= bikeBusStops.length; i++) {
      const currentEnd = i < bikeBusStops.length ? { lat: bikeBusStops[i].lat, lng: bikeBusStops[i].lng } : endPoint;
      const leg: RouteLeg = {
        startPoint: currentStart,
        endPoint: currentEnd,
        waypoints: [], // Add waypoints if needed
      };
      // Optionally, calculate distance and duration for each leg here
      legs.push(leg);
      currentStart = currentEnd;
    }

    return legs;
  };


  const generateNewRoute = async () => {
    if (!selectedRoute) {
      console.error("No route selected.");
      return;
    }
    // Ensure travelModeSelector is of the correct type
    const travelMode = travelModeSelector as google.maps.TravelMode ?? google.maps.TravelMode.BICYCLING;

    // the condition to check if there are any bikebusstops
    if (selectedRoute.BikeBusStopIds ) {
      // get new route without legs because there aren't any bikebusstops

      const routeWithOutLegs = await calculateRoute(selectedRoute.startPoint, selectedRoute.endPoint, [], travelMode, Number(bicyclingSpeed));
      // now setPathCoordinates to the pathCoordinates of the routeWithOutLegs
      setPathCoordinates(routeWithOutLegs.pathCoordinates.map(coord => ({ latitude: coord.lat, longitude: coord.lng })));
      // set the distance and duration of the route
      setDistance(routeWithOutLegs.distance);
      setDuration(routeWithOutLegs.duration);

    } else {
      // Generate route with legs
      const legs = await calculateRouteLegs(selectedRoute.startPoint, selectedRoute.endPoint, BikeBusStops);
      displayRouteOnMap(legs);
    }

    // Transform pathCoordinates to match expected structure for setPathCoordinates
    setPathCoordinates(pathCoordinates.map(coord => ({ latitude: coord.latitude, longitude: coord.longitude })));
    setDistance(distance);
    setDuration(duration);
  }




  const waypoints = [] as google.maps.DirectionsWaypoint[];

  const routeData = selectedRoute;

  const routeBikeBusStopIds = routeData?.BikeBusStopIds || [];
  let bikeBusStopsData: Array<BikeBusStops> = [];

  // Fetch BikeBusStops data if there are any
  const fetchBikeBusStops = async () => {
    if (routeBikeBusStopIds.length > 0) {
      const bikeBusStopsQuery = query(collection(db, 'bikebusstops'), where('__name__', 'in', routeBikeBusStopIds));
      const bikeBusStopsSnapshot = await getDocs(bikeBusStopsQuery);
      const bikeBusStopsData = bikeBusStopsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as unknown as Array<BikeBusStops>;

      bikeBusStopsData.forEach(stop => {
        const location = new google.maps.LatLng(stop.lat, stop.lng);
        waypoints.push({ location });
      });
    }
    setBikeBusStops(bikeBusStopsData);
    return bikeBusStopsData;
  };

  const calculateDistanceAndDuration = (origin: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place, destination: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place, travelMode: string, speedSelector: string) => {

    return new Promise<DistanceDurationResult>((resolve, reject) => {
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode[travelMode as keyof typeof google.maps.TravelMode],
      }, (response, status) => {
        if (status === "OK" && response?.rows[0]?.elements[0]?.status === "OK") {
          const distance = response.rows[0].elements[0].distance.value; // meters
          let duration = response.rows[0].elements[0].duration.value; // seconds

          // Adjust duration based on the selected speed
          const speedFactor = getSpeedAdjustmentFactor(speedSelector);
          duration *= speedFactor;

          const distanceInMiles = Math.round((distance * 0.000621371) * 100) / 100;
          const durationInMinutes = Math.round((duration / 60) * 100) / 100;

          const arrivalTime = new Date();
          arrivalTime.setSeconds(arrivalTime.getSeconds() + duration);
          const arrivalTimeString = arrivalTime.toLocaleTimeString();

          resolve({
            distance: distanceInMiles.toString(),
            duration: durationInMinutes.toString(),
            arrivalTime: arrivalTimeString,
          });
        } else {
          reject("Error calculating distance and duration: " + status);
        }
      });
    });
  };

  const getSpeedAdjustmentFactor = (speedSelector: any) => {
    switch (speedSelector) {
      case "VERY SLOW": return 1.2;
      case "SLOW": return 1.1;
      case "MEDIUM": return 1;
      case "FAST": return 0.9;
      default: return 1; // Default to no adjustment
    }
  };

  const handleRouteChange = async (directionsResult: google.maps.DirectionsResult | null) => {
    // Simplify route if necessary and calculate distance and duration
    if (!directionsResult) {
      throw new Error("Directions result is null");
    }
    const pathPoints = directionsResult.routes[0].overview_path.map(latLng => ({ latitude: latLng.lat(), longitude: latLng.lng() }));

    // Optionally update the state with the new simplified path points
    setPathCoordinates(pathPoints);

    console.log(travelModeSelector);
    const travelMode: keyof typeof google.maps.TravelMode = travelModeSelector as keyof typeof google.maps.TravelMode;
    let speedSelector = ''; // Default to an empty string or a sensible default for other modes
    if (travelModeSelector === 'BICYCLING') {
      // Set speedSelector for BICYCLING mode based on the selected speed from the user in the state of speedSelector
      speedSelector = bicyclingSpeedSelector;
    }

    if (selectedStartLocation === null || selectedEndLocation === null) {
      console.error("Start or end location is null");
      return; // Stop the function if either is null
    }


    // Call calculateDistanceAndDuration and destructure its result
    const calculationResult = await calculateDistanceAndDuration(
      selectedStartLocation,
      selectedEndLocation,
      travelModeSelector ?? 'BICYCLING',
      speedSelector
    );

    let distanceValue = '';
    let durationValue = '';
    let arrivalTimeValue = '';

    // Assign the results from calculationResult to the scoped variables
    distanceValue = calculationResult.distance;
    durationValue = calculationResult.duration;
    arrivalTimeValue = calculationResult.arrivalTime;

    setDistance(distanceValue);
    setDuration(durationValue);
    setArrivalTime(arrivalTimeValue);
  };

  const getDirectionsAndSimplifyRoute = async () => {
    try {
      if (!selectedStartLocation || !selectedEndLocation) {
        throw new Error("Start or end location is not set");
      }

      // Setup DirectionsService and DirectionsRenderer
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true,
        map: mapRef.current,
        preserveViewport: true,
      });

      let distanceValue = '';
      let durationValue = '';
      let arrivalTimeValue = '';

      if (travelModeSelector) {
        // Use travelModeSelector
        console.log(travelModeSelector);
        const travelMode = google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode];
        let speedSelector = ''; // Default to an empty string or a sensible default for other modes
        if (travelModeSelector === 'BICYCLING') {
          // Set speedSelector for BICYCLING mode based on the selected speed from the user in the state of speedSelector
          speedSelector = bicyclingSpeedSelector;
          // also enable the bicycling layer if the ref is not null
        }


        // Fetch and set initial directions
        const initialResult = await directionsService.route({
          origin: selectedStartLocation,
          destination: selectedEndLocation,
          travelMode: travelMode,
        });
        directionsRenderer.setDirections(initialResult);
        handleRouteChange(initialResult); // Function to process the route, calculate distances, etc.

        // Listen for directions changes (e.g., user drags the route)
        google.maps.event.addListener(directionsRenderer, 'directions_changed', () => {
          const newDirections = directionsRenderer.getDirections();
          handleRouteChange(newDirections); // Re-process the new route
        });

        // Indicate that directions have been fetched
        setDirectionsFetched(true);
      }
    }
    catch (error) {
      console.error("Failed to get directions:", error);
      // Optionally, handle setting state to reflect the error to the user
    }
  }

  const updateRoute = (newRoute: google.maps.DirectionsResult) => {
    if (directionsRenderer) {
      // Clear the existing route
      directionsRenderer.setMap(null);
    }

    const newDirectionsRenderer = new google.maps.DirectionsRenderer({
      // Your renderer options here
    });
    newDirectionsRenderer.setDirections(newRoute);
    newDirectionsRenderer.setMap(mapRef.current);
    setDirectionsRenderer(newDirectionsRenderer);
  };

  // useEffect the console.log the speedSelector so we can see the changes from the user
  useEffect(() => {
    console.log('speedSelector: ', bicyclingSpeedSelector);


    const updateRouteInformation = async () => {

      if (selectedRoute) {
        const origin = selectedRoute.startPoint;
        const destination = selectedRoute.endPoint;
        const travelMode = selectedRoute.travelMode;
        // get the current state of the speedSelector from the UI and pass it to the function
        const speedSelector = bicyclingSpeedSelector;
        console.log('speedSelector: ', speedSelector);

        try {
          const { distance, duration } = await calculateDistanceAndDuration(origin, destination, travelMode, speedSelector);
          console.log(`Distance: ${distance}, Duration: ${duration}`);
          // Update state or UI with calculated distance and duration
          setDistance(distance);
          setDuration(duration);
          setBicyclingSpeed(bicyclingSpeed);
          return { distance, duration };
        } catch (
        error
        ) {
          console.error("Failed to calculate distance and duration:", error);
          // Optionally, handle setting state to reflect the error to the user
        }
      }
    };

    updateRouteInformation();

  }, [bicyclingSpeedSelector]);


  const generateRouteWithLegs = async () => {

    if (!selectedRoute) {
      console.error("No route selected.");
      return;
    }

    const sortBikeBusStops = (bikeBusStopIds: DocumentReference[]) => {
      // Fetch the BikeBusStops documents based on the provided DocumentReferences
      const bikeBusStops = bikeBusStopIds.map(async (stopId) => {
        const stopSnap = await getDoc(stopId);
        return stopSnap.data() as BikeBusStops;
      });
      return bikeBusStops;
    };

    const bikeBusStopsSorted = await Promise.all(sortBikeBusStops(selectedRoute?.BikeBusStopIds)); // Await the Promise and pass the resolved value
    const legs = await calculateRouteLegs(selectedRoute.startPoint, selectedRoute.endPoint, bikeBusStopsSorted);

    for (const leg of legs) {
      // Convert Coordinate objects to DirectionsWaypoint objects
      const waypoints: google.maps.DirectionsWaypoint[] = leg.waypoints.map((waypoint) => ({
        location: waypoint,
        stopover: true,
      }));

      // Call Google Maps API to calculate directions for each leg
      const { distance, duration } = await calculateRoute(leg.startPoint, leg.endPoint, waypoints, google.maps.TravelMode.BICYCLING, Number(bicyclingSpeed));
      leg.distance = distance;
      leg.duration = duration;
    }

    // Update state or UI with the calculated legs
    // This could involve updating a map view, displaying leg info, etc.
  };

  const displayRouteOnMap = (legs: RouteLeg[]) => {
    legs.forEach((leg, index) => {
      // Create markers for start and end points of each leg
      new google.maps.Marker({ position: leg.startPoint, map: mapRef.current, label: `Start ${index + 1}` });
      if (index === legs.length - 1) { // Last leg
        new google.maps.Marker({ position: leg.endPoint, map: mapRef.current, label: 'End' });
      }

      // Draw polyline for the leg
      new google.maps.Polyline({
        path: [leg.startPoint, ...leg.waypoints, leg.endPoint],
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: mapRef.current,
      });
    });
  };



  const handleDeleteStop = async (StopId: string) => {
    try {
      if (selectedRoute) {
        console.log('selectedRoute:', selectedRoute);
        console.log('id:', id);
        console.log('StopId:', StopId);
        console.log('BikeBusStops:', BikeBusStops);

        // Create the DocRefStopid using the id of the stop to be deleted
        const DocRefStopid = doc(db, 'bikebusstops', StopId);
        console.log('DocRefStopid:', DocRefStopid);

        // Get the current route data
        const routeRef = doc(db, 'routes', id);
        const routeSnap = await getDoc(routeRef);
        const routeData = routeSnap.data() as Route;

        // Manually filtering out the DocRefStopId
        const updatedBikeBusStopIds = routeData.BikeBusStopIds.filter((stopId: any) => {
          return stopId.path !== DocRefStopid.path; // replace with your actual path matching logic
        });


        console.log('routeData:', routeData);
        console.log('routeData.BikeBusStopIds:', routeData.BikeBusStopIds);

        await updateDoc(routeRef, {
          ...routeData,
          BikeBusStopIds: updatedBikeBusStopIds,
        });

        // Delete the entry from the BikeBusStops array
        await deleteDoc(doc(db, 'bikebusstops', StopId));  // Changed from 'id' to 'StopId'
        console.log('Step executed: Deleted BikeBusStop document');

        alert('Stop deleted');
        setSelectedStopIndex(null);
        history.push(`/ViewRoute/${id}`)
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const saveBikeBusStopName = async (StopId: string) => {
    try {
      if (selectedRoute) {
        // Find the specific stop to update
        const stopToUpdate = BikeBusStops.find(stop => stop.id === StopId);
        if (!stopToUpdate) {
          console.error("Stop not found");
          return;
        }

        console.log('Stop to update:', stopToUpdate);

        // Create the DocRefStopid using the id of the stop to be updated
        const DocRefStopid = doc(db, 'bikebusstops', StopId);

        // Perform the update to the document
        await updateDoc(DocRefStopid, {
          BikeBusStopName: stopToUpdate.BikeBusStopName,
        });

        // Close the InfoWindow
        setSelectedStopIndex(null);
      }
    } catch (error) {
      console.error("Error updating document:", error);
    }
  }


  const handleRouteSave = async () => {
    if (!selectedRoute) {
      console.error("No route selected.");
      return;
    }

    try {
      // Construct the updated route object
      const updatedRouteData = {
        ...selectedRoute,
        bicyclingSpeed: bicyclingSpeedSelector,
        bicyclingSpeedSelector: bicyclingSpeedSelector,
        duration: duration,
        distance: distance,
      };

      // Firestore update
      const routeRef = doc(db, 'routes', selectedRoute.id);
      await updateDoc(routeRef, updatedRouteData);

      alert("Route successfully updated.");
      // Redirect or other post-save actions
      history.push(`/ViewRoute/${selectedRoute.id}`);
    } catch (error) {
      console.error("Failed to save the route:", error);
      alert("Error saving route.");
    }
  };


  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit Route</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <IonRow>
            <IonLabel>Route Name:</IonLabel>
            <IonInput
              value={selectedRoute?.routeName}
              onIonChange={e => {
                console.log('Before:', selectedRoute?.routeName);
                if (selectedRoute && e.detail.value !== null && e.detail.value !== undefined) {
                  setSelectedRoute({ ...selectedRoute, routeName: e.detail.value });
                }
                console.log('After:', selectedRoute?.routeName);
              }}
            />
          </IonRow>
          <IonItem>
            <IonLabel>Travel Mode:</IonLabel>
            <IonSelect aria-label='Travel Mode' value={selectedRoute?.travelMode} onIonChange={e => selectedRoute && setSelectedRoute({ ...selectedRoute, travelMode: e.detail.value })}>
              <IonSelectOption value="WALKING">Walking</IonSelectOption>
              <IonSelectOption value="BICYCLING">Bicycling</IonSelectOption>
              <IonSelectOption value="CAR">Car</IonSelectOption>
              <IonSelectOption value="TRANSIT">Transit</IonSelectOption>
            </IonSelect>
          </IonItem>
          {selectedRoute?.travelMode === "BICYCLING" && (
            <IonItem>
              <IonLabel>Speed:</IonLabel>
              <IonSegment value={bicyclingSpeedSelector} onIonChange={(e: CustomEvent) => {
                const newSpeedSelector = e.detail.value;
                setBicyclingSpeedSelector(newSpeedSelector);
                if (selectedRoute) {
                  setSelectedRoute({ ...selectedRoute, bicyclingSpeedSelector: newSpeedSelector });
                  setBicyclingSpeed(newSpeedSelector);
                }
              }
              }>
                <IonSegmentButton value="VERY SLOW">
                  <IonText>Very Slow</IonText>
                  <IonText>0-5mph</IonText>
                </IonSegmentButton>
                <IonSegmentButton value="SLOW">
                  <IonText>Slow</IonText>
                  <IonText>5-10mph</IonText>
                </IonSegmentButton>
                <IonSegmentButton value="MEDIUM">
                  <IonText>Medium</IonText>
                  <IonText>10-12mph</IonText>
                </IonSegmentButton>
                <IonSegmentButton value="FAST">
                  <IonText>Fast</IonText>
                  <IonText>12-20mph</IonText>
                </IonSegmentButton>
              </IonSegment>
            </IonItem>
          )}
          <IonItem>
            <IonLabel>Start Point:</IonLabel>
            <StandaloneSearchBox
              onLoad={onLoadStartingLocation}
              onPlacesChanged={onPlaceChangedStart}
            >
              <input
                type="text"
                autoComplete="on"
                placeholder={routeStartFormattedAddress}
                style={{
                  width: "250px",
                  height: "40px",
                }}
              />
            </StandaloneSearchBox>
          </IonItem>
          <IonItem>
            <IonLabel>End Point:</IonLabel>
            <StandaloneSearchBox
              onLoad={onLoadDestinationValue}
              onPlacesChanged={onPlaceChangedDestination}
            >
              <input
                type="text"
                autoComplete="on"
                placeholder={routeEndFormattedAddress}
                style={{
                  width: "250px",
                  height: "40px",
                }}
              />
            </StandaloneSearchBox>
          </IonItem>
          <IonItem>
            <IonText>Duration: </IonText>
            <IonText>{duration} Minutes</IonText>
          </IonItem>
          <IonRow>
            <IonCol>
              {isBikeBus && (
                <IonButton routerLink={`/CreateBikeBusStops/${id}`}>Add BikeBusStop</IonButton>
              )}
              {!isClicked && (
                <IonButton onClick={generateNewRoute}>Generate New Route</IonButton>
              )}
              <IonButton routerLink={`/UpdateRouteManually/${id}`}>Update Route Manually</IonButton>
              <IonButton color="success" onClick={handleRouteSave}>Save</IonButton>
              <IonButton color="danger" routerLink={`/ViewRoute/${id}`}>Cancel</IonButton>
            </IonCol>
          </IonRow>
          {selectedRoute && (
            <IonRow style={{ flex: '1' }}>
              <IonCol>
                <GoogleMap
                  mapContainerStyle={containerMapStyle}
                  center={mapCenter}
                  zoom={13}
                  options={{
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    disableDoubleClickZoom: true,
                    disableDefaultUI: true,
                    mapId: 'b75f9f8b8cf9c287',
                  }}
                >
                  {BikeBusStops.map((stop, index) => (
                    <Marker
                      key={index}
                      position={{ lat: Number(stop.lat), lng: Number(stop.lng) }}
                      label={stop.BikeBusStopName}
                      title={stop.BikeBusStopName}
                      onClick={() => setSelectedStopIndex(stop.StopId)}
                    >
                      {selectedStopIndex !== null && (

                        <InfoWindow>
                          <div>
                            <h5>{stop.BikeBusStopName}</h5>
                            <IonInput value={stop.BikeBusStopName} helperText="Enter new BikeBusStopName"
                              onIonChange={e => {
                                const updatedStop = { ...stop, BikeBusStopName: e.detail.value! };
                                setBikeBusStops(prevStops => prevStops.map(s => s.id === stop.id ? updatedStop : s));
                              }} />
                            <IonRow>
                              <IonButton onClick={() => saveBikeBusStopName(stop.id)}>Save BikeBusStop</IonButton>
                              <IonButton onClick={() => handleDeleteStop(String(stop.id))}>Delete BikeBusStop</IonButton>
                            </IonRow>
                          </div>
                        </InfoWindow>
                      )}
                    </Marker>
                  ))}
                  <Marker
                    position={{ lat: startGeo.lat, lng: startGeo.lng }}
                    title="Start"
                    label={"Start"}
                  >
                  </Marker>
                  <Marker
                    position={{ lat: endGeo.lat, lng: endGeo.lng }}
                    title="End"
                    label={"End"}
                  >
                  </Marker>
                  <React.Fragment key={selectedRoute?.pathCoordinates?.toString()}>
                    <Polyline
                      path={selectedRoute?.pathCoordinates}
                      options={{
                        strokeColor: "#000000",
                        strokeOpacity: 1,
                        strokeWeight: 5,
                        geodesic: true,
                        draggable: false,
                        editable: false,
                        visible: true,
                      }}
                    />
                    <Polyline
                      path={selectedRoute?.pathCoordinates}
                      options={{
                        strokeColor: "#ffd800",
                        strokeOpacity: 1,
                        strokeWeight: 3,
                        geodesic: true,
                        draggable: false,
                        editable: false,
                        visible: true,
                      }}
                    />
                  </React.Fragment>
                </GoogleMap>

              </IonCol>
            </IonRow>
          )}

        </IonGrid>
      </IonContent>
    </IonPage >
  );
};

export default EditRoute;
