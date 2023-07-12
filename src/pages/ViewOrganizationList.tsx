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
    OrganizationName: string;
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

        const OrganizationCollection = collection(db, 'organizations');
        const q = query(OrganizationCollection, where('OrganizationMembers', 'array-contains', doc(db, 'users', `${user?.uid}`)));
        console.log('Query:', q);
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
                    <IonList>
                        {Organization.map((Organization) => (
                            <IonItem key="id">
                                <IonLabel>{Organization.OrganizationName}</IonLabel>
                                <IonButton routerLink={`/ViewOrganization/${Organization.id}`}>View BikeBus</IonButton>
                            </IonItem>
                        ))}
                    </IonList>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default ViewOrganizationList;
