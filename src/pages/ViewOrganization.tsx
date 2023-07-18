import {
    IonContent,
    IonHeader,
    IonPage,
    IonButton,
    IonIcon,
    IonRow,
    IonGrid,
    IonCol,
    IonToolbar,
    IonAvatar,
    IonLabel,
    IonInput,
    IonItem,
    IonTitle,
    IonModal,
} from "@ionic/react";
import { useEffect, useCallback, useState, useContext } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useHistory, useParams } from "react-router-dom";
import {
    locateOutline,
    personCircleOutline,
    school,
} from "ionicons/icons";


import { HeaderContext } from "../components/HeaderContext";
import React from "react";
import Avatar from "../components/Avatar";
import { useAvatar } from "../components/useAvatar";
import {
    DocumentData,
    doc as firestoreDoc,
} from "firebase/firestore";
import { get } from "http";


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
    BikeBusGroups: string[];
    BikeBusGroupIds: string[];
    BikeBusGroupNames: string[];
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
    Messages: string[],
    CreatedOn: Date,
    LastUpdatedBy: string
    LastUpdatedOn: Date,
};

const ViewOrganization: React.FC = () => {
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


    // the id of the url param is the id of the collection document for the organization
    // get the document data
    const [Organization, setOrganization] = useState<Organization | null>(null);


    useEffect(() => {
        if (user) {
            const userRef = firestoreDoc(db, "users", user.uid);
            const routesRef = collection(db, "routes");
            const BikeBusGroupsRef = collection(db, "BikeBusGroups");
            const queryObj = query(
                routesRef,
                where("isBikeBus", "==", true),

            );

            const BikeBusGroupsLeaderQueryObj = query(
                BikeBusGroupsRef,
                // where the logged in user is a leader of the BikeBusGroup
                where("BikeBusGroupLeader", "==", user.uid),
            );

            // now get the documents where BikeBusGroupLeader is equal to the logged in user's uid
            getDocs(BikeBusGroupsLeaderQueryObj)
                .then((querySnapshot) => {
                    const BikeBusGroups: any[] = [];
                    querySnapshot.forEach((doc) => {
                        const BikeBusGroupData = doc.data();
                        BikeBusGroups.push(BikeBusGroupData);
                    });
                    setBikeBusRoutes(BikeBusGroups);
                })
                .catch((error) => {
                });

            const BikeBusGroupsMemberQueryObj = query(
                BikeBusGroupsRef,
                // where the logged in user is a member of the BikeBusGroup
                where("BikeBusGroupMembers", "array-contains", user.uid),
            );

            // now get the documents where the BikeBusGroup member is equal to the logged in user's uid
            getDocs(BikeBusGroupsMemberQueryObj)
                .then((querySnapshot) => {
                    const BikeBusGroups: any[] = [];
                    querySnapshot.forEach((doc) => {
                        const BikeBusGroupData = doc.data();
                        BikeBusGroups.push(BikeBusGroupData);
                    });
                    setBikeBusRoutes(BikeBusGroups);
                })
                .catch((error) => {
                });






            getDocs(queryObj)
                .then((querySnapshot) => {
                    const routes: any[] = [];
                    querySnapshot.forEach((doc) => {
                        const routeData = doc.data();
                        routes.push(routeData);
                    });
                    setBikeBusRoutes(routes);
                })
                .catch((error) => {
                });

            const organizationRef = firestoreDoc(db, "organizations", id);
            getDoc(organizationRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const organizationData = docSnapshot.data();
                    if (organizationData) {
                        // let's get information from the document like the name, type, website and so on
                        setOrganization(organizationData as Organization);
                        setOrgType(organizationData.OrganizationType);
                        setOrgLocation(organizationData.Location);
                        setSchoolDistrict(organizationData.SchoolDistrictName);
                        setSchools(organizationData.SchoolNames);
                        setSchool(organizationData.SchoolNames[0]);

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
    }, [bikeBusRoutes, id, user]);

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

    const setShowBikeBusGroupAddModal = (show: boolean) => {
        setShowBikeBusGroupAddModal(show);
    };

    const showBikeBusGroupAddModal = () => {
        setShowBikeBusGroupAddModal(true);
    };

    function updateOrgType(orgType: string) {
        updateOrgType(orgType);
        console.log("updateOrgType: ", updateOrgType);
    }

    function updateOrgLocation(orgLocation: string) {
        updateOrgLocation(orgLocation);
        console.log("updateOrgLocation: ", updateOrgLocation);
    }


    function updateSchoolDistrict(schoolDistrict: string) {
        updateSchoolDistrict(schoolDistrict);
        console.log("updateSchoolDistrict: ", updateSchoolDistrict);
    }

    function addSchool(school: string) {
        setSchools(prevSchools => [...prevSchools, school]);
    }

    return (
        <IonPage>
            <IonContent fullscreen className="ion-flex ion-flex-direction-column">
                <IonHeader>
                    <IonToolbar>
                        {headerContext?.showHeader && <IonHeader></IonHeader>}
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-flex-grow">
                    <IonGrid>
                        <IonRow>
                            <IonCol>
                                <IonTitle>{Organization?.NameOfOrg}</IonTitle>
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonButton>Send Invite</IonButton>
                            <IonButton>Add Staff</IonButton>
                            <IonButton>Map</IonButton>
                            <IonButton>Schedules</IonButton>
                            <IonButton>View Timesheets</IonButton>
                            <IonButton>Add BikeBusGroup</IonButton>
                            <IonButton>Add Schools</IonButton>
                            <IonButton>Add Routes</IonButton>
                            <IonButton>Reports</IonButton>
                            <IonButton>Collated BulletinBoard</IonButton>
                        </IonRow>
                        <IonRow>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Type: {Organization?.OrganizationType}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Website: <a href="{Organization?.Website}">{Organization?.NameOfOrg}</a></IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Email: <a href="mailto:{Organization?.Email}">{Organization?.Email}</a></IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Contact Name: {Organization?.ContactName}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">BikeBusGroups: {Organization?.BikeBusGroups}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Schools: {Organization?.schools}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">School District: {Organization?.SchoolDistrictName}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Location: {Organization?.Location}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Mailing Address: {Organization?.MailingAddress}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Organization Administrators: {Organization?.OrganizationAdmins}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Organization Managers: {Organization?.OrganizationManagers}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Organization Employees: {Organization?.OrganizationEmployees}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>
                                <IonItem>
                                    <IonLabel position="stacked">Organization Volunteers: {Organization?.OrganizationVolunteers}</IonLabel>
                                </IonItem>
                            </IonCol>
                            <IonCol>

                            </IonCol>


                        </IonRow>
                    </IonGrid>
                </IonContent>
            </IonContent>
        </IonPage>
    );
};

export default ViewOrganization;
