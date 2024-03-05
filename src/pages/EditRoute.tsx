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
import { useContext, useEffect, useRef, useState } from 'react';
import { db } from '../firebaseConfig';
import { DocumentReference, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
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
  id: string; // Document ID
  BikeBusStopName: string;
  formattedAddress: string;
  // `location` should be an object with `lat` and `lng` properties if it's stored as GeoPoint in Firestore
  location: Coordinate;
  photos: string; // Assuming it's a string URL or could be an array of string URLs if multiple
  placeId: string;
  placeName: string;
}
interface Route {
  newStop: Coordinate | null;
  BikeBusGroup: DocumentReference;
  BikeBusStops: BikeBusStops
  id: string;
  endPointAddress: string;
  endPointName: string;
  startPointAddress: string;
  startPointName: string;
  BikeBusGroupId: string;
  BikeBusName: string;
  accountType: string;
  bicyclingSpeed: string;
  bicyclingSpeedSelector: string;
  description: string;
  distance: string;
  duration: string;
  endPoint: {
    lat: number;
    lng: number;
  };
  isBikeBus: boolean;
  pathCoordinates: Array<{
    lat: number;
    lng: number;
  }>;
  routeCreator: string;
  routeLeader: string;
  routeName: string;
  routeType: string;
  startPoint: {
    lat: number;
    lng: number;
    startPointAddress: string;
    startPointName: string;
  };
  travelMode: string;
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
  const bicyclingLayerRef = useRef<google.maps.BicyclingLayer | null>(null);

  const [selectedStartLocation, setSelectedStartLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0, });
  const [selectedEndLocation, setSelectedEndLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeStartName, setRouteStartName] = useState<string>('');
  const [routeEndName, setRouteEndName] = useState<string>('');
  const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>('');
  const [routeEndFormattedAddress, setRouteEndFormattedAddress] = useState<string>('');
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
  const bikeBusStopIds = selectedRoute?.BikeBusStops || [];
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const [newStop, setNewStop] = useState<Coordinate | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<BikeBusStops | null>(null);

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
      setTravelModeSelector(selectedRoute.bicyclingSpeedSelector);
    }
  }
    , [selectedRoute]);

  const onPlaceChangedStart = () => {
    if (autocompleteStart !== null) {
      const places = autocompleteStart.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
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
    if (autocompleteEnd !== null) {
      const places = autocompleteEnd.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
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

          if (routeData.routeCreator !== "/users/" + user.uid) {
            alert('You are not the creator of this route');
            history.push('/ViewRoute/' + id);
          }
        }
      }

    };

    if (id) fetchSingleRoute(id);

    console.log(selectedRoute);

    const fetchBikeBusStopsForRoute = async () => {
      if (!id || !selectedRoute) return;

      console.log("Fetching bikebusstops for route:", id);
  
      const bikeBusStopsSnapshot = await getDocs(collection(db, 'routes', id, 'BikeBusStops'));
      console.log("BikeBusStops snapshot:", bikeBusStopsSnapshot);
      const BikeBusStops = bikeBusStopsSnapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() } as BikeBusStops;
      });
  
      setBikeBusStops(BikeBusStops);
    };

      // confirm loading for the bikebusstops with the console.log
      console.log(BikeBusStops);
    

    fetchBikeBusStopsForRoute();

  }
    , [id, user]);



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
            startGeo: docSnap.data().startPoint,
            endGeo: docSnap.data().endPoint,
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

      if (selectedRoute?.BikeBusStops) {
        // let's fetch the bikebusstop data from the firestore and set it to the state
        const fetchBikeBusStops = async () => {
          // first let's get the bikebusstop ids from the selectedRoute
          const bikeBusStopIds = Array.isArray(selectedRoute.BikeBusStops) ? selectedRoute.BikeBusStops : [];
          const bikeBusStops = [];
          for (const stopId of bikeBusStopIds) {
            const stopSnap = await getDoc(stopId);
            if (stopSnap.exists()) {
              bikeBusStops.push({ id: stopSnap.id, ...(stopSnap.data() as object) });
            }
          }
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

        console.log(selectedRoute);
        console.log(BikeBusStops);
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
    // now inspect the type that is returned from startPoint and endPoint

    const batchSize = 10;
    const batches = [];
    const epsilon = 0.00005; // Define epsilon for Douglas-Peucker algorithm. Distance in degrees. 0.00005 is about 5.5 meters.
    const routeRequests = [];

    for (let i = 0; i < waypoints.length; i += batchSize) {
      const batch: google.maps.DirectionsWaypoint[] = waypoints.slice(i, Math.min(i + batchSize, waypoints.length));
      if (i !== 0) {
        batch.unshift(waypoints[i - 1]);
      }
      if (i + batchSize < waypoints.length) {
        batch.push(waypoints[i + batchSize]);
      }
      batches.push(batch);
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


      // Debugging for empty array
      if (batchWaypoints.length === 0) {
        console.warn("batchWaypoints is empty!");
      }
      // deeply inspect the batchWaypoints array
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
              // log the response and status from the directionsService.route
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
        // Example of accessing lat and lng
        const currentEnd = i < bikeBusStops.length ? bikeBusStops[i].location : endPoint;
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
      const currentEnd = i < bikeBusStops.length ? { lat: bikeBusStops[i].location.lat, lng: bikeBusStops[i].location.lng } : endPoint;
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
    if (selectedRoute.BikeBusStops) {
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

  const generateLegsFromStops = (stops: BikeBusStops[]): RouteLeg[] => {
    const legs: RouteLeg[] = [];
    for (let i = 0; i < stops.length; i++) {
      const start = i === 0 ? selectedRoute?.startPoint : stops[i - 1].location;
      const end = i === stops.length - 1 ? selectedRoute?.endPoint : stops[i].location;
      if (start && end) {
        legs.push({
          startPoint: start,
          endPoint: end,
          waypoints: [],
        });
      }
    }
    return legs;
  }


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

 

 

  // useEffect the console.log the speedSelector so we can see the changes from the user
  useEffect(() => {
    console.log(bicyclingSpeedSelector);

    const updateRouteInformation = async () => {

      if (selectedRoute) {
        const origin = selectedRoute.startPoint;
        const destination = selectedRoute.endPoint;
        const travelMode = selectedRoute.travelMode;
        // get the current state of the speedSelector from the UI and pass it to the function
        const speedSelector = bicyclingSpeedSelector;

        try {
          const { distance, duration } = await calculateDistanceAndDuration(origin, destination, travelMode, speedSelector);
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

    const bikeBusStopsSorted = await Promise.all(sortBikeBusStops(selectedRoute.BikeBusStops as unknown as DocumentReference[]));
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


  const handleRouteSave = async () => {
    console.log("Route ID:", selectedRoute?.id);

    if (!selectedRoute) {
      console.error("No route selected.");
      return;
    }

    try {
      // Construct the updated route object
      const updatedRouteData = {
        routeName: selectedRoute.routeName,
        startPoint: selectedRoute.startPoint,
        endPoint: selectedRoute.endPoint,
        startPointAddress: selectedRoute.startPointAddress,
        endPointAddress: selectedRoute.endPointAddress,
        travelMode: selectedRoute.travelMode,
        pathCoordinates: selectedRoute.pathCoordinates,
        bicyclingSpeed: selectedRoute.bicyclingSpeed,
        bicyclingSpeedSelector: selectedRoute.bicyclingSpeedSelector,
        duration: selectedRoute.duration,
        distance: selectedRoute.distance,
      };

      // Firestore update
      const routeRef = doc(db, 'routes', selectedRoute.id);
      console.log("Updating route:", updatedRouteData);
      console.log("Route reference:", routeRef);
      console.log("Route ID:", selectedRoute.id);
      console.log("Updated route data:", updatedRouteData);
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
                if (selectedRoute && e.detail.value !== null && e.detail.value !== undefined) {
                  setSelectedRoute({ ...selectedRoute, routeName: e.detail.value });
                }
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
              {isBikeBus && (
                <IonButton onClick={() => generateRouteWithLegs()}>Generate Route With Legs</IonButton>
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
                {isLoaded && (
                  <GoogleMap
                    onLoad={(map) => {
                      mapRef.current = map;
                      bicyclingLayerRef.current = new google.maps.BicyclingLayer();
                    }}
                    mapContainerStyle={containerMapStyle}
                    center={mapCenter}
                    zoom={13}
                    options={{
                      zoomControl: true,
                      zoomControlOptions: {
                        position: window.google.maps.ControlPosition.LEFT_CENTER
                      },
                      mapTypeControl: false,
                      mapTypeControlOptions: {
                        position: window.google.maps.ControlPosition.LEFT_CENTER, // Position of map type control
                        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain',],
                      },
                      streetViewControl: false,
                      fullscreenControl: true,
                      disableDoubleClickZoom: true,
                      disableDefaultUI: true,
                      mapId: 'b75f9f8b8cf9c287',
                    }}
                    onUnmount={() => {
                      mapRef.current = null;
                    }}
                  >

                    {bicyclingLayerRef.current && selectedRoute.travelMode === "BICYCLING" && (
                      <IonButton
                        onClick={() => {
                          if (bicyclingLayerRef.current) {
                            bicyclingLayerRef.current.setMap(bicyclingLayerRef.current.getMap() ? null : mapRef.current);
                          }
                        }}
                      >
                        Toggle Bicycling Layer
                      </IonButton>
                    )}
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
                    {BikeBusStops?.map((stop, index) => (
                      <Marker
                        zIndex={10}
                        key={index}
                        position={{ lat: stop.location.lat, lng: stop.location.lng }}
                        title={stop.BikeBusStopName}
                        label={stop.BikeBusStopName}
                        onClick={() => {

                        }}
                      />
                    ))}

                    <Marker
                      zIndex={1}
                      position={{ lat: startGeo.lat, lng: startGeo.lng }}
                      title="Start"
                      label={"Start"}
                    />
                    <Marker
                      zIndex={10}
                      position={{ lat: endGeo.lat, lng: endGeo.lng }}
                      title="End"
                      label={"End"}
                    />
                  </GoogleMap>
                )}
              </IonCol>
            </IonRow>
          )}

        </IonGrid>
      </IonContent>
    </IonPage >
  );
};

export default EditRoute;
