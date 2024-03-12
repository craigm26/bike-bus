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
  IonToggle,
  IonModal,
  IonButtons,
  IonList,
} from '@ionic/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { db } from '../firebaseConfig';
import { DocumentReference, collection, deleteDoc, doc, getDoc, getDocs, updateDoc,  } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, StandaloneSearchBox } from '@react-google-maps/api';
import React from 'react';
import { AuthContext } from '../AuthContext';
import { get } from 'http';
import { set } from 'date-fns';

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

interface InfoBoxState {
  show: boolean;
  content: JSX.Element | null;
  position: Coordinate | null;
}

// a BikeBusStop is an array of BikeBusStops that exist as a subcollection of the route
interface BikeBusStop {
  BikeBusGroup: DocumentReference;
  BikeBusRouteId: string;
  BikeBusStopName: string;
  id: string;
  location: Coordinate;
  placeId: string;
  photos: string;
  formattedAddress: string;
  placeName: string;
}
interface Route {
  eventCheckInLeader: any;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number, lng: number };
  pathCoordinates: {
    latitude: any;
    longitude: any; lat: number; lng: number 
}[];
  startPointName: string;
  endPointName: string;
  startPointAddress: string;
  endPointAddress: string;
  routeName: string;
  routeType: string;
  routeCreator: DocumentReference;
  routeLeader: DocumentReference;
  description: string;
  travelMode: string;
  isBikeBus: boolean;
  BikeBusName: string;
  BikeBusStops: BikeBusStop[];
  BikeBusGroup: DocumentReference;
  id: string;
  accountType: string;
  bicylingSpeed: string;
  bicyclingSpeedSelector: string;
  routeId: string;
  name: string;
  distance: string;
  duration: string;
  arrivalTime: string;
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
  const [selectedRoute, setSelectedRoute] = useState<Route>();
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

  const [isClicked, setIsClicked] = useState<boolean>(false);
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
  const [isBicyclingLayerVisible, setIsBicyclingLayerVisible] = useState(false);
  const onLoadDestinationValue = (ref: google.maps.places.SearchBox) => {
    setAutocompleteEnd(ref);
  };

  const [showInfoStopModal, setshowInfoStopModal] = useState(false);
  const polylineRef = useRef<google.maps.Polyline>(null);
  const [bikeBusStops, setBikeBusStops] = useState<BikeBusStop[]>([]);
  const [bikeBusStop, setBikeBusStop] = useState<BikeBusStop>();
  const [bikeBusStopName, setBikeBusStopName] = useState<string>('');
  const [waypoints, SetWaypoints] = useState<DirectionsWaypoint[]>([]);




  useEffect(() => {
    const polyline = polylineRef.current;

    if (polyline) {
      const path = polylineRef.current.getPath();
      const onPathChanged = () => {
        const updatedPath = path.getArray().map((coord: { lat: () => any; lng: () => any; }) => ({ latitude: coord.lat(), longitude: coord.lng() }));
        // Here you can update your state or backend with the updatedPath
        console.log(updatedPath);
        // For example, update the local state (this will require a state setup for pathCoordinates):
        setPathCoordinates(updatedPath);
      };

      return () => {
        google.maps.event.clearListeners(path, 'set_at');
        google.maps.event.clearListeners(path, 'insert_at');
      };
    }
  }, [polylineRef, setPathCoordinates]); // Add dependencies as necessary


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

  const fetchBikeBusStops = async () => {
    // first let's get the bikebusstop documents from the selectedRoute.BikeBusStops
    const BikeBusStopsSnapshot = await getDocs(collection(db, 'routes', id, 'BikeBusStops'));
    // now we want to map through the BikeBusStopsSnapshot and return the data and then set to state
    const BikeBusStops = BikeBusStopsSnapshot.docs.map((doc) => {

      const data = doc.data() as any; // use 'any' temporarily to bypass type checking
      // Assume 'location' is a GeoPoint, extract 'latitude' and 'longitude'
      const location = data.location; // This should be a Firestore GeoPoint
      return {
        ...doc.data() as BikeBusStop,
        id: doc.id,
        location: {
          lat: location.latitude,
          lng: location.longitude,
        },
      };
    });

    setBikeBusStops(BikeBusStops);
  };

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
      setBicyclingSpeed(selectedRoute.bicylingSpeed);
      setBicyclingSpeedSelector(selectedRoute.bicyclingSpeedSelector);
      setTravelModeSelector(selectedRoute.travelMode);
      setPathCoordinates(selectedRoute.pathCoordinates.map(coord => ({ latitude: coord.lat, longitude: coord.lng })));
      setDistance(selectedRoute.distance);
      setDuration(selectedRoute.duration);
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
        BikeBusStops: docSnap.data().BikeBusStops,
        BikeBusGroupId: docSnap.data().BikeBusGroupId,
        pathCoordinates: docSnap.data().pathCoordinates,
        travelMode: docSnap.data().travelMode,
        bicyclingSpeed: docSnap.data().bicyclingSpeed,
        bicyclingSpeedSelector: docSnap.data().bicyclingSpeedSelector,
        distance: docSnap.data().distance,
        duration: docSnap.data().duration,
        routeCreator: docSnap.data().routeCreator,
      };
      // we want to console log BikeBusStops to see if it's an array of BikeBusStops
      setSelectedRoute(routeData);

      if (routeData.routeCreator !== user.uid) {
        alert('You are not the creator of this route');
        history.push('/ViewRoute/' + id);
      }
    }
  };


  useEffect(() => {

    if (id) fetchSingleRoute(id);

    fetchBikeBusStops();

    const bikeBusStopsRef = collection(db, 'routes', id, 'BikeBusStops');
    // now we can console.log the bikeBusStopsRef to see if it's a collection reference
    // we can use the getDocs function to get the documents from the collection reference
    const bikeBusStopsSnapshot = getDocs(bikeBusStopsRef);
    // we should also fetch the legs of the route in the id of the route as a subcollection called "legs"
    const legsRef = collection(db, 'routes', id, 'legs');
    // now we can console.log the legsRef to see if it's a collection reference
    // we can use the getDocs function to get the documents from the collection reference
    const legsSnapshot = getDocs(legsRef);

    // set bikeBusStops as waypoints
    const waypoints = bikeBusStops.map(stop => ({
      location: new google.maps.LatLng(stop.location.lat, stop.location.lng),
      stopover: true,
    }));
    SetWaypoints(waypoints);

  }
    , [id, user, history]);



  useEffect(() => {

    if (isLoaded) {

      fetchSingleRoute(id);

      if (selectedRoute) {


        if (selectedRoute) {
          setMapCenter({
            lat: (selectedRoute.startPoint.lat + selectedRoute.endPoint.lat) / 2,
            lng: (selectedRoute.startPoint.lng + selectedRoute.endPoint.lng) / 2,
          });
        }

        if (selectedStartLocation) {
          setStartGeo(selectedStartLocation);
        }

        if (selectedEndLocation) {
          setEndGeo(selectedEndLocation);
        }

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
  const calculateRoute = async (startPoint: Coordinate, endPoint: Coordinate, waypoints: google.maps.DirectionsWaypoint[], travelMode: google.maps.TravelMode, bicyclingSpeed: number,
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


    const calculateRouteLegs = async (startPoint: Coordinate, endPoint: Coordinate, BikeBusStops: BikeBusStop[]) => {
      let legs: RouteLeg[] = [];
      let currentStart = startPoint;



      for (let i = 0; i <= BikeBusStops.length; i++) {
        // Example of accessing lat and lng
        const currentEnd = i < BikeBusStops.length ? { lat: BikeBusStops[i].location.lat, lng: BikeBusStops[i].location.lng } : endPoint;
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


  const calculateRouteLegs = async (startPoint: Coordinate, endPoint: Coordinate, BikeBusStops: BikeBusStop[]) => {
    let legs: RouteLeg[] = [];
    let currentStart = startPoint;

    for (let i = 0; i <= BikeBusStops.length; i++) {
      const currentEnd = i < BikeBusStops.length ? { lat: BikeBusStops[i].location.lat, lng: BikeBusStops[i].location.lng } : endPoint;
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

    // the condition to check if there are any BikeBusStops
    if (!selectedRoute.BikeBusStops) {
      // get new route without legs because there aren't any BikeBusStops

      const routeWithOutLegs = await calculateRoute(selectedRoute.startPoint, selectedRoute.endPoint, [], travelMode, Number(bicyclingSpeed));
      // now setPathCoordinates to the pathCoordinates of the routeWithOutLegs
      setPathCoordinates(routeWithOutLegs.pathCoordinates.map(coord => ({ latitude: coord.lat, longitude: coord.lng })));
      // set the distance and duration of the route
      setDistance(routeWithOutLegs.distance);
      setDuration(routeWithOutLegs.duration);

    } else {
      const waypoints = selectedRoute.BikeBusStops.map(stop => ({
        location: new google.maps.LatLng(stop.location.lat, stop.location.lng),
        stopover: true,
      }));
      
      // Generate route with legs
      const legs = await calculateRouteLegs(selectedRoute.startPoint, selectedRoute.endPoint, selectedRoute.BikeBusStops);
      // Now we can use the legs to generate the route
      const pathCoordinates: { latitude: number; longitude: number; }[] = [];
      let distance = 0;
      let duration = 0;

      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const { pathCoordinates: legPathCoordinates, distance: legDistance, duration: legDuration } = await calculateRoute(leg.startPoint, leg.endPoint, leg.waypoints.map(coord => ({ location: coord })), travelMode, Number(bicyclingSpeed));
        pathCoordinates.push(...legPathCoordinates.map(coord => ({ latitude: coord.lat, longitude: coord.lng })));
        distance += Number(legDistance);
        duration += Number(legDuration);

        if (i < legs.length - 1) {
          // Add a straight line between legs
          const straightLineDistance = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(leg.endPoint), new google.maps.LatLng(legs[i + 1].startPoint));
          distance += straightLineDistance;
        }
      }
    }


    // now setPathCoordinates to the pathCoordinates of the routeWithLegs
    setPathCoordinates(pathCoordinates);
  }

  const generateLegsFromStops = (stops: typeof bikeBusStops[]): RouteLeg[] => {
    const legs: RouteLeg[] = [];

    return legs;
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

  // useEffect the console.log the speedSelector so we can see the changes from the user
  useEffect(() => {

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


  // pass in stop.id to the handleBikeBusStopClick function
  const handleUpdateClick = async (stopId: string) => {
    console.log({ db, routeId: id, stopId, bikeBusStopName });

    try {
      // Update the BikeBusStop in Firestore
      await updateDoc(doc(db, 'routes', id, 'BikeBusStops', stopId), {
        BikeBusStopName: bikeBusStopName,
      });
      alert("BikeBusStop updated successfully.");
      // refresh map
      fetchBikeBusStops();
    } catch (error) {
      console.error("Error updating BikeBusStop:", error);
      alert("Error updating BikeBusStop.");
    }

  };

  const handleDeleteClick = async (stopId: string) => {
    console.log({ db, routeId: id, stopId });
    // Confirm the delete operation
    if (window.confirm("Are you sure you want to delete this BikeBusStop?")) {
      try {
        await deleteDoc(doc(db, 'routes', id, 'BikeBusStops', stopId));
        // Filter out the deleted stop from the local state to update the UI
        setBikeBusStops(bikeBusStops.filter(stop => stop.id !== stopId));
        alert("BikeBusStop deleted successfully.");
      } catch (error) {
        console.error("Error deleting BikeBusStop:", error);
        alert("Error deleting BikeBusStop.");
      }
    }
  };

  const handleBikeBusStopClick = async (BikeBusStop: BikeBusStop) => {
    setshowInfoStopModal(true);
  };


  const handleRouteSave = async () => {

    if (!selectedRoute) {
      console.error("No route selected.");
      return;
    }

    try {
      const formattedPathCoordinates = selectedRoute.pathCoordinates.map(coord => ({
        lat: coord.lat,
        lng: coord.lng,
      }));

      const routeRef = doc(db, 'routes', id);

      // Construct the updated route object
      const updatedRouteData = {
        routeName: selectedRoute?.routeName,
        startPoint: selectedRoute?.startPoint,
        endPoint: selectedRoute?.endPoint,
        startPointName: selectedRoute.startPointName,
        endPointName: selectedRoute.endPointName,
        startPointAddress: routeStartFormattedAddress,
        endPointAddress: routeEndFormattedAddress,
        travelMode: selectedRoute?.travelMode,
        pathCoordinates: formattedPathCoordinates,
        bicyclingSpeed: bicyclingSpeedSelector,
        bicyclingSpeedSelector: selectedRoute.bicyclingSpeedSelector,
        duration: duration,
        distance: distance,
      };



      // Update the route in Firestore
      await updateDoc(routeRef, updatedRouteData);

      alert("Route successfully updated.");
    } catch (error) {
      console.error("Failed to update the route:", error);
      alert("Error updating route.");
      history.push(`/ViewRouteList/`);
    }
    // Redirect or other post-save actions
    history.push(`/ViewRouteList/`);
  };


  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Editing {selectedRoute?.routeName}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <IonRow>
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
                <IonButton size="small" shape="round" onClick={() => setshowInfoStopModal(true)}>Manage BikeBusStops</IonButton>
              )}
              <IonButton size="small" shape="round" onClick={generateNewRoute}>Generate New Route</IonButton>
              {/*<IonButton size="small" shape="round" routerLink={`/UpdateRouteManually/${id}`}>Update Route Manually</IonButton>*/}
              <IonButton size="small" shape="round" color="success" onClick={handleRouteSave}>Save</IonButton>
              <IonButton size="small" shape="round" color="danger" routerLink={`/ViewRoute/${id}`}>Cancel</IonButton>
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
                    <Polyline
                      path={selectedRoute?.pathCoordinates}
                      options={{
                        zIndex: 1,
                        strokeColor: "#1a73e8",
                        strokeOpacity: 1,
                        strokeWeight: 5,
                        geodesic: true,
                        draggable: true,
                        editable: true,
                        visible: true,
                      }}
                      onLoad={(polyline) => {
                        // Use polyline.getPath() to access the path and attach listeners
                        const path = polyline.getPath();

                        const updatePathCoordinates = () => {
                          const updatedPath = path.getArray().map(coord => ({ latitude: coord.lat(), longitude: coord.lng() }));
                          console.log('updatedPath:', updatedPath);
                          // For example, update the local state (this will require a state setup for pathCoordinates):
                          setPathCoordinates(updatedPath); 
                        };

                        google.maps.event.addListener(path, 'set_at', updatePathCoordinates);
                        google.maps.event.addListener(path, 'insert_at', updatePathCoordinates);                       

                      }}
                    />

                    {bicyclingLayerRef.current && selectedRoute.travelMode === "BICYCLING" && (

                      <IonToggle
                        checked={isBicyclingLayerVisible}
                        onIonChange={e => {
                          setIsBicyclingLayerVisible(e.detail.checked);
                          if (bicyclingLayerRef.current) {
                            bicyclingLayerRef.current.setMap(e.detail.checked ? mapRef.current : null);
                          }
                        }}
                      >
                        <IonLabel className="toggle-bicycle-layer">Toggle Bicycling Layer</IonLabel>
                      </IonToggle>
                    )}
                    {bikeBusStops.map((BikeBusStop, index) => (
                      <Marker
                        key={index}
                        label={BikeBusStop.BikeBusStopName || 'BikeBus Stop'}
                        position={BikeBusStop.location}
                        title={BikeBusStop.BikeBusStopName}
                        onClick={() =>
                          handleBikeBusStopClick(BikeBusStop)
                        }
                      />
                    ))}
                    <IonModal isOpen={showInfoStopModal} onDidDismiss={() => setshowInfoStopModal(false)}>
                      <IonHeader>
                        <IonToolbar>
                          <IonTitle>Add, Update or Delete BikeBusStops</IonTitle>
                          <IonButtons slot="end">
                            <IonButton onClick={() => setshowInfoStopModal(false)}>Close</IonButton>
                          </IonButtons>
                        </IonToolbar>
                      </IonHeader>
                      <IonContent>
                        <IonGrid>
                          <IonRow>
                            <IonCol size="12">
                              <IonButton
                                color="primary"
                                onClick={() => {
                                  history.push(`/CreateBikeBusStops/${id}`);
                                }}
                              >
                                Add BikeBusStop
                              </IonButton>
                            </IonCol>
                          </IonRow>
                          <IonRow>
                            <IonList>
                              {bikeBusStops.map((stop, index) => {
                                console.log(stop);
                                return (
                                  <IonItem key={stop.id}>
                                    <IonLabel>BikeBusStop Name:</IonLabel>
                                    <IonInput
                                      value={stop.BikeBusStopName}
                                      onIonChange={(e) => setBikeBusStopName(e.detail.value!)}
                                    />
                                    <IonButton color="light" onClick={() => handleUpdateClick(stop.id)}>
                                      Update Name
                                    </IonButton>
                                    <IonButton color="danger" onClick={() => handleDeleteClick(stop.id)}>
                                      Delete
                                    </IonButton>
                                  </IonItem>
                                )
                              }
                              )}
                            </IonList>

                          </IonRow>
                        </IonGrid>
                      </IonContent>
                    </IonModal>
                    <Marker
                      zIndex={1}
                      position={{ lat: selectedRoute.startPoint.lat, lng: selectedRoute.startPoint.lng }}
                      title="Start"
                      label={"Start"}
                    />
                    <Marker
                      zIndex={10}
                      position={{ lat: selectedRoute.endPoint.lat, lng: selectedRoute.endPoint.lng }}
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
