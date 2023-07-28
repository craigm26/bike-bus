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
} from "@ionic/react";
import { useEffect, useCallback, useState, useContext } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { db } from "../firebaseConfig";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
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

interface UserData {
    username: string;
    uid: string;
    accountType: string;
    enabledAccountModes: string[];
    avatarUrl: string;
    email: string;
}



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
            const userRef = firestoreDoc(db, "users", user.uid);
            const routesRef = collection(db, "routes");
            const BikeBusGroupsRef = collection(db, "BikeBusGroups");

            const queryObj = query(
                routesRef,
                where("isBikeBus", "==", true),
            );

            const BikeBusGroupsLeaderQueryObj = query(
                BikeBusGroupsRef,
                where("BikeBusGroupLeader", "==", user.uid),
            );

            getDocs(BikeBusGroupsLeaderQueryObj)
                .then((querySnapshot) => {
                    const BikeBusGroups: any[] = [];
                    querySnapshot.forEach((doc) => {
                        const BikeBusorgData = doc.data();
                        BikeBusGroups.push(BikeBusorgData);
                    });
                    setBikeBusRoutes(BikeBusGroups);
                })
                .catch((error) => {
                    console.log(error);
                });

            const BikeBusGroupsMemberQueryObj = query(
                BikeBusGroupsRef,
                where("BikeBusGroupMembers", "array-contains", user.uid),
            );

            getDocs(BikeBusGroupsMemberQueryObj)
                .then((querySnapshot) => {
                    const BikeBusGroups: any[] = [];
                    querySnapshot.forEach((doc) => {
                        const BikeBusorgData = doc.data();
                        BikeBusGroups.push(BikeBusorgData);
                    });
                    setBikeBusRoutes(BikeBusGroups);
                })
                .catch((error) => {
                    console.log(error);
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
                    console.log(error);
                });

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

                        getDoc(userRef).then((docSnapshot) => {
                            if (docSnapshot.exists()) {
                                const userData = docSnapshot.data();
                            }
                        });

                        const organizationId = docSnapshot.id;
                        setOrganizationId(organizationId);

                        const BikeBusGroupsRef = collection(db, "BikeBusGroups");
                        const queryObj = query(
                            BikeBusGroupsRef,
                            where("Organization", "==", organizationId),
                        );
                        getDocs(queryObj)
                            .then((querySnapshot) => {
                                const BikeBusGroups: any[] = [];
                                querySnapshot.forEach((doc) => {
                                    const BikeBusorgData = doc.data();
                                    BikeBusGroups.push(BikeBusorgData);
                                });
                                setBikeBusRoutes(BikeBusGroups);
                            })
                            .catch((error) => {
                                console.log("Error getting documents: ", error);
                            });
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

    const fetchMembers = useCallback(async () => {
        if (orgData?.BikeBusMembers && Array.isArray(orgData.BikeBusMembers)) {
            const members = orgData.BikeBusMembers.map((member: any) => {
                return getDoc(member)
                    .then((docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const memberData = docSnapshot.data();
                            return memberData ? {
                                ...memberData,
                                id: docSnapshot.id,
                            } : { id: docSnapshot.id };
                        } else {
                            // Return a placeholder object if the member document doesn't exist
                            return { id: member.id };
                        }
                    })
                    .catch((error) => {
                        // Handle the error if necessary
                    });
            });
            const membersData = await Promise.all(members);
            setMembersData(membersData);
            // Fetch usernames and avatars for members
            const usernamesArray = await Promise.all(
                membersData.map(async (member) => {
                    if (member && member.username) {
                        const userRefId = member.username.split('/').pop();
                        const userRef = doc(db, 'users', userRefId);
                        const userSnapshot = await getDoc(userRef);
                        if (userSnapshot.exists()) {
                            const userData = userSnapshot.data();
                            return userData?.username;
                        }
                    }
                    return null;
                })
            );
            setMemberUsernames(usernamesArray);
        }
    }, [orgData]);

    const showBikeBusGroupAddModal = () => {
        setShowBikeBusGroupAddModal(true);
    };

    return (
        <IonPage className="ion-flex-offset-app">
            <IonContent fullscreen className="ion-flex">
                <IonHeader>
                    <IonToolbar>
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
                            <IonButton routerLink={`/EditOrganization/${organizationId}`}>Edit Organization</IonButton>
                            <IonButton>Send Invite</IonButton>
                            <IonButton>Add Staff</IonButton>
                            <IonButton routerLink={`/OrganizationMap/${organizationId}`}>Map</IonButton>
                            <IonButton>Schedules</IonButton>
                            <IonButton>Timesheets</IonButton>
                            <IonButton>Add BikeBusGroup</IonButton>
                            <IonButton>Add Schools</IonButton>
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
                        </IonRow>
                    </IonGrid>
                </IonContent>
            </IonContent>
        </IonPage>
    );
};

export default ViewOrganization;

