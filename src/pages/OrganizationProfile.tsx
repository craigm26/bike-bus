import {
    IonContent,
    IonHeader,
    IonPage,
    IonIcon,
    IonRow,
    IonGrid,
    IonCol,
    IonToolbar,
    IonAvatar,
    IonLabel,
    IonItem,
} from "@ionic/react";
import { useEffect, useCallback, useState, useContext } from "react";
import useAuth from "../useAuth";
import { ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { collection, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useHistory, useParams } from "react-router-dom";
import {
    personCircleOutline,
} from "ionicons/icons";
import {
    useJsApiLoader,
} from "@react-google-maps/api";
import { HeaderContext } from "../components/HeaderContext";
import React from "react";
import Avatar from "../components/Avatar";
import { useAvatar } from "../components/useAvatar";
import {
    DocumentData,
    doc as firestoreDoc,
} from "firebase/firestore";

const libraries: any = ["places", "drawing", "geometry", "localContext", "visualization"];

const DEFAULT_ACCOUNT_MODES = ["Member"];

type RouteType = "SCHOOL" | "WORK";

type Point = {
    lat: number;
    lng: number;
};

type Place = {
    name: string;
    formatted_address: string;
    geometry: {
        location: {
            lat(): number;
            lng(): number;
        };
    };
};

type Organization = {
    id: string;
    name: string;
    location: string;
    type: string;
    schoolDistrict: string;
    schools: string[];
    bikeBusRoutes: string[];
    bikeBusGroups: string[];
    bikeBusGroupIds: string[];
    bikeBusGroupNames: string[];
    NameOfOrg: string;
    OrganizationType: string;
    Website: string;
    Email: string;
    PhoneNumber: string;
    ContactName: string;
    Description: string;
    Location: '',
    MailingAddress: '',
    SchoolDistrictName: '',
    SchoolDistrictLocation: '',
    SchoolNames: [''],
    SchoolLocations: [''],
    OrganizationCreator: string;
    // any user who has one role in the OrganizationMembers array will be able to view certain parts of the ViewOrganization page
    OrganizationMembers: string[],
    // admins can delete users, change user roles, and change organization settings
    OrganizationAdmins: string[],
    // managers can create events, create schedules, create bike bus groups, create routes, and create trips while assign employees to routes, bike bus groups, events, and trips
    OrganizationManagers: string[],
    // employees can view schedules, view events, view routes, view trips and accept assignments
    OrganizationEmployees: string[],
    // volunteers can view schedules, view events, and view routes and accept assignments
    OrganizationVolunteers: string[],
    Schedules: string[],
    Events: string[],
    Event: string[],
    BulletinBoards: string[],
    Trips: string[],
    Routes: string[],
    BikeBusGroups: string[],
    Messages: string[],
    CreatedOn: Date,
    LastUpdatedBy: string
    LastUpdatedOn: Date,
};

const OrganizationProfile: React.FC = () => {
    const { user, isAnonymous } = useAuth();
    const history = useHistory();
    const { id } = useParams<{ id: string }>();
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
    const [username, setUsername] = useState<string>("");
    const [accountType, setAccountType] = useState<string>("");
    const [selectedStartLocation, setSelectedStartLocation] = useState<Point>({ lat: 0, lng: 0 });
    const [selectedEndLocation, setSelectedEndLocation] = useState<Point | null>(null);
    const headerContext = useContext(HeaderContext);
    const [showCreateRouteButton, setShowCreateRouteButton] = useState(false);
    const [userLocation, setUserLocation] = useState<Point>({ lat: 0, lng: 0 });
    const [showGetDirectionsButton, setShowGetDirectionsButton] = useState(false);
    const [autocompleteStart, setAutocompleteStart] = useState<google.maps.places.SearchBox | null>(null);
    const [autocompleteEnd, setAutocompleteEnd] = useState<google.maps.places.SearchBox | null>(null);
    const [mapCenter, setMapCenter] = useState<Point>({ lat: 0, lng: 0 });
    const [mapZoom, setMapZoom] = useState(8);
    const [getLocationClicked, setGetLocationClicked] = useState(false);
    const mapRef = React.useRef<google.maps.Map | null>(null);
    const { avatarUrl } = useAvatar(user?.uid);
    const [travelMode, setTravelMode] = useState<string>("");
    const [travelModeSelector, setTravelModeSelector] = useState<string>("BICYCLING");
    const [distance, setDistance] = useState<string>("");
    const [duration, setDuration] = useState<string>("");
    const [arrivalTime, setArrivalTime] = useState<string>("");
    const [routeStartLocation, setRouteStartLocation] = useState<string>("");
    const [routeStartName, setRouteStartName] = useState<string>("");
    const [routeStartStreetName, setRouteStartStreetName] = useState<string>("");
    const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>("");
    const [routeType, setRouteType] = useState<RouteType>("SCHOOL");
    const [pathCoordinates, setPathCoordinates] = useState<Point[]>([]);
    const [startPointAddress, setStartPointAddress] = useState<string>("");
    const [selectedEndLocationAddress, setSelectedEndLocationAddress] = useState<string>("");
    const [selectedStartLocationAddress, setSelectedStartLocationAddress] = useState<string>("");
    const [endPointAddress, setEndPointAddress] = useState<string>("");
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [userLocationAddress, setUserLocationAddress] = useState("Loading...");
    const [route, setRoute] = useState<DocumentData | null>(null);
    const [orgType, setOrgType] = useState<string>("");
    const [orgLocation, setOrgLocation] = useState<string>("");
    const [schoolDistrict, setSchoolDistrict] = useState<string>("");
    const [school, setSchool] = useState<string>("");
    const [schools, setSchools] = useState<string[]>([]);


    const [bikeBusRoutes, setBikeBusRoutes] = useState<Array<any>>([]);
    const [infoWindow, setInfoWindow] = useState<{ isOpen: boolean, content: string, position: { lat: number, lng: number } | null }>
        ({ isOpen: false, content: '', position: null });

    // the purpose of this page is to display the organization's profile for the admin to view and edit. This is the main page for the admin to view and edit the organization's profile.


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
                                setRouteStartFormattedAddress(`${results[0].formatted_address}` ?? "");
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
        console.log("User Location Address", userLocationAddress);
    }, [userLocationAddress]);


    // the id of the url param is the id of the collection document for the organization
    // get the document data
    const [Organization, setOrganization] = useState<Organization | null>(null);


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

            // let's get the bikebusgroups from firebase by using the Organization doc for the current organization - BikeBusGroups as a document reference
            const organizationRef = firestoreDoc(db, "organizations", id);
            getDoc(organizationRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const organizationData = docSnapshot.data();
                    if (organizationData) {
                        if (organizationData.bikeBusGroups) {
                            const bikeBusGroupIds = organizationData.bikeBusGroups;
                            console.log("bikeBusGroupIds: ", bikeBusGroupIds);
                            const bikeBusGroupIdsArray = bikeBusGroupIds?.split(",");
                            console.log("bikeBusGroupIdsArray: ", bikeBusGroupIdsArray);
                            const bikeBusGroupIdsArray2 = bikeBusGroupIdsArray?.map((bikeBusGroupId: string) => {
                                return bikeBusGroupId.trim();
                            });
                            console.log("bikeBusGroupIdsArray2: ", bikeBusGroupIdsArray2);
                            const bikeBusGroupIdsArray3 = bikeBusGroupIdsArray2?.map((bikeBusGroupId: string) => {
                                return firestoreDoc(db, "bikeBusGroups", bikeBusGroupId);
                            });
                            console.log("bikeBusGroupIdsArray3: ", bikeBusGroupIdsArray3);
                            Promise.all(bikeBusGroupIdsArray3).then((bikeBusGroupDocs) => {
                                console.log("bikeBusGroupDocs: ", bikeBusGroupDocs);
                                const bikeBusGroups: any[] = [];
                                bikeBusGroupDocs.forEach((bikeBusGroupDoc) => {
                                    const bikeBusGroupData = bikeBusGroupDoc.data();
                                    bikeBusGroups.push(bikeBusGroupData);
                                });
                                console.log("bikeBusGroups: ", bikeBusGroups);
                                const bikeBusGroupNames = bikeBusGroups.map((bikeBusGroup) => {
                                    return bikeBusGroup.BikeBusName;
                                });
                                console.log("bikeBusGroupNames: ", bikeBusGroupNames);
                                setBikeBusRoutes(bikeBusGroups);
                                console.log("Bike Bus Routes", bikeBusRoutes);
                            });
                        }
                    }
                }
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
    console.log("Bike Bus Routes", bikeBusRoutes);

    useEffect(() => {
        if (user && getLocationClicked) {
            watchLocation();
        }
    }, [user, getLocationClicked, watchLocation]);

    //update map center when user location changes or selected location changes. When both have changed, set map center to show both locations on the map. Also set the zoom to fit both markers.
    useEffect(() => {
        if (selectedStartLocation && selectedEndLocation) {
            setMapCenter({
                lat: (selectedEndLocation.lat + selectedStartLocation.lat) / 2,
                lng: (selectedEndLocation.lng + selectedStartLocation.lng) / 2,
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

    const handleBikeBusRouteClickPolyline = (routeId: string) => {
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
                        lng: place.geometry.location.lng(),
                    });
                    // define place.address_components
                    const addressComponents = place.address_components;
                    // extract street name
                    const streetName = addressComponents?.find((component) =>
                        component.types.includes("route")
                    )?.long_name;

                    setRouteStartStreetName(streetName ?? "");
                    setRouteStartName(`${place.name}` ?? "");
                    setRouteStartFormattedAddress(`${place.formatted_address}` ?? "");
                }
            }
        }
    };

    const onLoadStartingLocation = (ref: google.maps.places.SearchBox) => {
        setAutocompleteStart(ref);
        onPlaceChangedStart();

        setSelectedStartLocation({ lat: userLocation.lat, lng: userLocation.lng });
    };

    // handleMarkerClick(stop)
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

    const handleBikeBusRouteClickMarker = (routeId: string) => {
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

    function updateSchoolDistrict(schoolDistrict: string) {
        updateSchoolDistrict(schoolDistrict);
        console.log("updateSchoolDistrict: ", updateSchoolDistrict);
    }

    function addSchool(school: string) {
        setSchools(prevSchools => [...prevSchools, school]);
    }


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
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <IonItem>
                                <IonLabel position="stacked">Name: {Organization?.NameOfOrg}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem>
                                <IonLabel position="stacked">Type: {Organization?.OrganizationType}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem>
                                <IonLabel position="stacked">Website: {Organization?.Website}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem>
                                <IonLabel position="stacked">Email: {Organization?.Email}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem>
                                <IonLabel position="stacked">Phone Number: {Organization?.PhoneNumber}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem>
                                <IonLabel position="stacked">Contact Name: {Organization?.ContactName}</IonLabel>
                            </IonItem>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default OrganizationProfile;
