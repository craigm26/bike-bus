import {
    IonContent,
    IonPage,
    IonItem,
    IonList,
    IonInput,
    IonLabel,
    IonButton,
    IonHeader,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonCardTitle,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import useAuth from "../useAuth";



interface Coordinate {
    lat: number;
    lng: number;
}

interface Organization {
    id: string;
    NameOfOrg: string;
    accountType: string;
    description: string;
    OrganizationCreator: string;
}

const ViewOrganizationList: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [Organization, setOrganization] = useState<Organization[]>([]);

    useEffect(() => {
        if (headerContext) {
            headerContext.setShowHeader(true); // Hide the header for false, Show the header for true (default)
        }
    }, [headerContext]);

    useEffect(() => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    if (userData && userData.accountType) {
                        setaccountType(userData.accountType);
                    }
                }
            });
        }
    }, [user]);

    const fetchOrganizations = useCallback(async () => {
        const uid = user?.uid;
        console.log('UID:', uid);

        if (!uid) {
            return;
        }

        // Fetch the user's document reference
        const userRef = doc(db, 'users', uid);

        const OrganizationCollection = collection(db, 'organizations');
        // Use the user's document reference in the query
        const q = query(OrganizationCollection, where('OrganizationMembers', 'array-contains', userRef));

        const querySnapshot = await getDocs(q);

        const OrganizationData: Organization[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as Organization,
            id: doc.id,
        }));
        console.log('OrganizationData:', OrganizationData);
        setOrganization(OrganizationData);
    }, [user]);



    useEffect(() => {
        console.log(user);
        fetchOrganizations();
    }, [fetchOrganizations, user]);



    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    {headerContext?.showHeader && <IonHeader></IonHeader>}
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonCard>
                    {Organization.length === 0 ? (
                        <IonCardContent>
                            <IonCardTitle>How to Create or Join an Organization</IonCardTitle>
                            <IonLabel>Organizations are a specific group of people who manage multiple BikeBus groups and routes.</IonLabel>
                            <IonLabel>Organizations can be created and joined by anyone with a BikeBus account. Everyone is a member; a lot of functions are based on higher privileges .</IonLabel>
                            <IonLabel>When you create an Organization, you become the Organization's Administrator.</IonLabel>
                            <IonLabel>As an Administrator, you can create BikeBus groups and routes for your Organization.</IonLabel>
                            <IonLabel>As an Administrator, you can invite other people to join your Organization.</IonLabel>
                            <IonList>
                                <IonLabel>To Create an Organization:</IonLabel>
                                <IonItem>1. <IonButton className="ion-button-profile" fill="solid" routerLink="/Login">LogIn</IonButton></IonItem>
                                <IonItem>2. Create a Organization:  <IonButton className="ion-button-profile" fill="solid" routerLink="/CreateOrganization">Create Organization</IonButton></IonItem>
                                <IonItem>3. Invite people to join your Organization:  <IonButton className="ion-button-profile" fill="solid" routerLink="/Help">Help: Inviting People to Join Your Organization</IonButton></IonItem>
                                <IonItem>4. Delegate roles to your Organization:</IonItem>
                                <IonItem>5. Create BikeBus groups and routes for your Organization:</IonItem>
                                <IonItem>6. Train others on timekeeping and reporting</IonItem>
                            </IonList>
                        </IonCardContent>
                    ) : (
                        <IonCardContent>
                            <p>You are a member of the following Organizations:</p>
                            <IonList>
                                {Organization.map((Organization) => (
                                    <IonItem key={Organization.id}>
                                        <IonLabel>{Organization.NameOfOrg}</IonLabel>
                                        <IonButton routerLink={`/ViewOrganization/${Organization.id}`}>View Organization</IonButton>
                                    </IonItem>
                                ))}
                            </IonList>
                        </IonCardContent>
                    )}

                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default ViewOrganizationList;
