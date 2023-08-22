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
    IonItem,
    IonTitle,
    IonCardTitle,
} from "@ionic/react";
import { useEffect, useCallback, useState, useContext } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { db } from "../firebaseConfig";
import { DocumentReference, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useHistory, useParams } from "react-router-dom";
import {
    personCircleOutline,
} from "ionicons/icons";
import { HeaderContext } from "../components/HeaderContext";
import React from "react";
import Avatar from "../components/Avatar";
import { useAvatar } from "../components/useAvatar";
import {
    DocumentData,
    doc as firestoreDoc,
} from "firebase/firestore";
import { database } from "firebase-functions/v1/firestore";

interface UserData {
    username: string;
    uid: string;
    accountType: string;
    enabledAccountModes: string[];
    avatarUrl: string;
    email: string;
}

type BikeBusGroups = {
    id: string;
    BikeBusName: string;
    BikeBusLocation: string;
    BikeBusCreator: string;
    BikeBusLeader: string;
}



type Organization = {
    id: string;
    name: string;
    location: string;
    type: string;
    schoolDistrict: string;
    schools: string[];
    bikeBusRoutes: string[];
    //BikeBusGroups should be a document reference to the bikebusgroups collection
    BikeBusGroups: DocumentReference[];
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
    const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
    const [username, setUsername] = useState<string>("");
    const [accountType, setAccountType] = useState<string>("");
    const mapRef = React.useRef<google.maps.Map | null>(null);
    const { avatarUrl } = useAvatar(user?.uid);
    const [route, setRoute] = useState<DocumentData | null>(null);
    const [orgType, setOrgType] = useState<string>("");
    const [orgLocation, setOrgLocation] = useState<string>("");
    const [schoolDistrict, setSchoolDistrict] = useState<string>("");
    const [school, setSchool] = useState<string>("");
    const [schools, setSchools] = useState<string[]>([]);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [membersData, setMembersData] = useState<any[]>([]);
    const [memberUserNames, setMemberUsernames] = useState<string[]>([]);
    const [orgData, setOrgData] = useState<any>(null);
    const [organizationId, setOrganizationId] = useState<string>("");
    const [BikeBusGroupNames, setBikeBusGroupNames] = useState<string[]>([]);
    const [BikeBusGroups, setBikeBusGroups] = useState<BikeBusGroups[]>([]);





    // cheatsheet to all of the accountTypes available:
    // App Admin, Org Admin, Member, Leader, Parent, Kid, Anonymous
    // Cheatsheet to all of the BikeBusGroup roles available:
    // BikeBusCreator, BikeBusLeader, BikeBusMembers, 
    // cheatsheet ot all of the Organization user types available: 
    // OrganizationCreator, OrganizationAdmins, OrganizationManagers, OrganizationEmployees, OrganizationVolunteers, OrganizationMembers


    const [bikeBusRoutes, setBikeBusRoutes] = useState<Array<any>>([]);

    // the purpose of this page is to display the organization's profile for the admin to view and edit. This is the main page for the admin to view and edit the organization's profile.


    // the id of the url param is the id of the collection document for the organization
    // get the document data
    const [Organization, setOrganization] = useState<Organization | null>(null);

    useEffect(() => {
        if (user) {
            // use the user data to determine what account modes are enabled and org modes are enabled
            const userRef = firestoreDoc(db, "users", user.uid);

            // use the organization data to determine what bikebusgroups are in their control as well as the event(s), schedule(s), and route(s) that they are in control of

            const organizationRef = firestoreDoc(db, "organizations", id);
            getDoc(organizationRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const organizationData = docSnapshot.data();
                    if (organizationData) {
                        setOrganization(organizationData as Organization);
                        setOrgType(organizationData.OrganizationType);
                        setOrgLocation(organizationData.Location);
                        setSchoolDistrict(organizationData.SchoolDistrictName);
                        setSchools(organizationData.SchoolNames);
                        setSchool(organizationData.SchoolNames[0]);
                        setBikeBusGroups(organizationData.BikeBusGroups);
                        console.log("organizationData", organizationData);
                        console.log("BikeBusGroups", organizationData.BikeBusGroups);

                        getDoc(userRef).then((docSnapshot) => {
                            if (docSnapshot.exists()) {
                                const userData = docSnapshot.data();
                            }
                        });

                        const organizationId = docSnapshot.id;
                        setOrganizationId(organizationId);
                        // Define an async function to handle the await inside
                        const getBikeBusGroupsData = async () => {
                            const BikeBusGroupsData = await Promise.all(
                                organizationData.BikeBusGroups.map((ref: DocumentReference) => getDoc(ref).then(doc => doc.data()))
                            );

                            setBikeBusGroups(BikeBusGroupsData as BikeBusGroups[]);
                            console.log("BikeBusGroups", BikeBusGroupsData);
                        };

                        // Call the async function
                        getBikeBusGroupsData();
                        console.log('BikeBusGroups:', BikeBusGroups);

                    }
                }
            });
        }
    }, [id, user]);


    const setShowBikeBusGroupAddModal = (show: boolean) => {
        setShowBikeBusGroupAddModal(show);
    };

    return (
        <IonPage className="ion-flex-offset-app">
            <IonContent fullscreen className="ion-flex">
                <IonCardTitle>{Organization?.NameOfOrg}</IonCardTitle>
                <IonGrid>
                    <IonRow>
                        <IonButton routerLink={`/EditOrganization/${organizationId}`}>Edit Organization</IonButton>
                        <IonButton>Send Invite</IonButton>
                        <IonButton routerLink={`/OrganizationMap/${organizationId}`}>Map</IonButton>
                        <IonButton>Schedules</IonButton>
                        <IonButton>Timesheets</IonButton>
                        <IonButton>Reports</IonButton>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonItem lines="none">
                                <IonLabel position="stacked">Organization Type: {Organization?.OrganizationType}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem lines="none">
                                <IonLabel position="stacked">Organization Location: {Organization?.Location}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem lines="none">
                                <IonLabel position="stacked">Organization Contact: {Organization?.ContactName}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem lines="none">
                                <IonLabel position="stacked">Organization Email: {Organization?.Email}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem lines="none">
                                <div>
                                    {Array.isArray(BikeBusGroups) && BikeBusGroups.map((BikeBusGroup) => (
                                        <div key={BikeBusGroup.id}>
                                            <IonLabel position="stacked">Bike Bus Group: {BikeBusGroup.BikeBusName}</IonLabel>
                                        </div>
                                    ))}
                                </div>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem lines="none">
                            </IonItem>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default ViewOrganization;

