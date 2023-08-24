import {
    IonContent,
    IonPage,
    IonButton,
    IonRow,
    IonGrid,
    IonCol,
    IonLabel,
    IonItem,
    IonCardTitle,
    IonRouterLink,
} from "@ionic/react";
import { useEffect, useState } from "react";
import "./ViewOrganization.css";
import useAuth from "../useAuth";
import { db } from "../firebaseConfig";
import { DocumentReference, DocumentSnapshot, getDoc } from "firebase/firestore";
import { useHistory, useParams } from "react-router-dom";
import React from "react";
import { useAvatar } from "../components/useAvatar";
import {
    DocumentData,
    doc as firestoreDoc,
} from "firebase/firestore";

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
    BikeBusLeader: DocumentReference;
    Organization: DocumentReference;
}



type Organization = {
    id: string;
    name: string;
    location: string;
    type: string;
    schoolDistrict: string;
    schools: string[];
    bikeBusRoutes: string[];
    BikeBusGroups?: DocumentReference[];
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
    const [BikeBusGroupIds, setBikeBusGroupIds] = useState<string[]>([]);






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
    const [organization, setOrganization] = useState<Organization | null>(null);

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
                        getDoc(userRef).then((docSnapshot) => {
                            if (docSnapshot.exists()) {
                                const userData = docSnapshot.data();
                            }
                        });

                        // get the document id of the bikebusgroups from the organization data
                        getDoc(organizationRef).then((docSnapshot) => {
                            if (docSnapshot.exists()) {
                                const organizationData = docSnapshot.data();
                                if (organizationData) {
                                    setOrganization(organizationData as Organization);
                                    const BikeBusGroups = organizationData.BikeBusGroups;
                                    // let's get the document id of each BikeBusGroup
                                    const BikeBusGroupIds = BikeBusGroups.map((BikeBusGroup: DocumentReference) => BikeBusGroup.id);
                                    console.log("BikeBusGroupIds", BikeBusGroupIds);
                                    setBikeBusGroupIds(BikeBusGroupIds);
                                }
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
                            // let's get the document id of each BikeBusGroup
                        };

                        // Call the async function
                        getBikeBusGroupsData();

                    }
                }
            });
        }
    }, [id, user]);

    useEffect(() => {
        const fetchBikeBusGroups = async (organization: Organization) => {
            if (organization.BikeBusGroups) {
                const bikeBusGroupsData = await Promise.all(
                    organization.BikeBusGroups.map((ref: DocumentReference) => getDoc(ref))
                );
                const bikeBusGroups = bikeBusGroupsData.map((doc: DocumentSnapshot) => ({
                    id: doc.id,
                    ...doc.data()
                }) as BikeBusGroups);
                setBikeBusGroups(bikeBusGroups);
            }
        };
        
          

          if (organization) {
            fetchBikeBusGroups(organization);
          }
          
        }, [organization]);

    // lets get the document id of the bikebusgroups from the organization data
    console.log("BikeBusGroupIds", BikeBusGroupIds);
    console.log("BikeBusGroups", BikeBusGroups);
    BikeBusGroups.forEach(group => console.log("BikeBusGroup.id", group.id)); // Use forEach to loop over the array

    const setShowBikeBusGroupAddModal = (show: boolean) => {
        setShowBikeBusGroupAddModal(show);
    };

    return (
        <IonPage className="ion-flex-offset-app">
            <IonContent fullscreen className="ion-flex">
                <IonCardTitle>{organization?.NameOfOrg}</IonCardTitle>
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
                                <IonLabel position="stacked">Organization Type: {organization?.OrganizationType}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem lines="none">
                                <IonLabel position="stacked">Organization Location: {organization?.Location}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem lines="none">
                                <IonLabel position="stacked">Organization Contact: {organization?.ContactName}</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem lines="none">
                                <IonLabel position="stacked">Organization Email: {organization?.Email}</IonLabel>
                            </IonItem>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                    <IonCol>
                            <IonItem lines="none">
                                <IonLabel position="stacked">Bike Bus Groups: </IonLabel>
                                <div>
                                    {BikeBusGroups.map((BikeBusGroup) => (
                                        <div key={BikeBusGroup.id}>
                                            <IonRouterLink className="BikeBusName" routerLink={`/BikeBusGroupPage/${BikeBusGroup.id}`}>
                                                {BikeBusGroup.BikeBusName}
                                            </IonRouterLink>
                                        </div>
                                    ))}
                                </div>
                            </IonItem>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default ViewOrganization;

