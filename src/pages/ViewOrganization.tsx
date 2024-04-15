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
    IonHeader,
    IonTitle,
    IonToolbar,
} from "@ionic/react";
import { useEffect, useState } from "react";
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

    const getBikeBusGroupsData = async (groups: DocumentReference[]) => {
        if (!groups) return; // Exit if groups are undefined

        const BikeBusGroupsData = await Promise.all(
            groups
              .filter((ref): ref is DocumentReference => ref instanceof DocumentReference)
              .map((ref: DocumentReference) => getDoc(ref))
          );

        const validBikeBusGroups = BikeBusGroupsData
            .filter((docSnapshot) => docSnapshot.exists())
            .map((docSnapshot) => ({
                id: docSnapshot.id,
                ...docSnapshot.data(),
            }) as BikeBusGroups);

        setBikeBusGroups(validBikeBusGroups);
    };

    const fetchOrganizationData = async () => {
        const organizationRef = firestoreDoc(db, "organizations", id);
        const docSnapshot = await getDoc(organizationRef);
        if (docSnapshot.exists()) {
          const organizationData = docSnapshot.data() as Organization;
          setOrganization(organizationData);
          
          // Call getBikeBusGroupsData with the BikeBusGroups array if it exists
          if (organizationData.BikeBusGroups) {
            await getBikeBusGroupsData(organizationData.BikeBusGroups);
          }
        }
      };

    useEffect(() => {
        if (user) {
            fetchOrganizationData();
        }

        
    }, [id, user]);

    return (
        <IonPage className="ion-flex-offset-app">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>{organization?.NameOfOrg}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonGrid>
                    <IonRow>
                        <IonButton shape="round" routerLink={`/EditOrganization/${id}`}>Edit Organization</IonButton>
                        <IonButton shape="round" routerLink={`/ViewSchedule`}>Events</IonButton>
                        <IonButton shape="round" routerLink={`/BulletinBoards/${id}`}>Bulletin Board</IonButton>
                        {/*if user is an admin or manager
                        <IonButton>Timesheets</IonButton>
                        <IonButton>Reports</IonButton>
                        */}
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

