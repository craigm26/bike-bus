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
    IonCardHeader,
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

interface BikeBus {
    id: string;
    accountType: string;
    description: string;
    endPoint: Coordinate;
    BikeBusCreator: string;
    BikeBusLeader: string;
    BikeBusName: string;
    BikeBusType: string;
    startPoint: Coordinate;
    travelMode: string;
}

const ViewBikeBusList: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [BikeBus, setBikeBus] = useState<BikeBus[]>([]);

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

    const fetchBikeBus = useCallback(async () => {
        const uid = user?.uid;
        console.log('UID:', uid);

        if (!uid) {
            return;
        }

        const BikeBusCollection = collection(db, 'bikebusgroups');
        const q = query(BikeBusCollection, where('BikeBusMembers', 'array-contains', doc(db, 'users', `${user?.uid}`)));
        console.log('Query:', q);
        const querySnapshot = await getDocs(q);



        const BikeBusData: BikeBus[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as BikeBus,
            id: doc.id,
        }));
        console.log('BikeBusData:', BikeBusData);
        setBikeBus(BikeBusData);
    }, [user]);


    useEffect(() => {
        console.log(user);
        fetchBikeBus();
    }, [fetchBikeBus, user]);



    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    {headerContext?.showHeader && <IonHeader></IonHeader>}
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonCard>
                    {BikeBus.length === 0 ? (
                        <IonCard>
                            <IonCardHeader>
                                <IonCardTitle>Creating a BikeBus</IonCardTitle>
                            </IonCardHeader>
                            <IonCardContent>
                                <IonList>
                                    <IonItem>1. <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/Login">LogIn</IonButton></IonItem>
                                    <IonItem>2. Create a Route:  <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/Help">Help</IonButton></IonItem>
                                    <IonItem>3. View the Route:  <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/ViewRouteList">View your Routes</IonButton></IonItem>
                                    <IonItem>4. Select the "Create BikeBus Group" button</IonItem>
                                    <IonItem>5. Fill in the "Create BikeBus" form</IonItem>
                                    <IonItem>6. Create your schedule of upcoming events</IonItem>
                                    <IonItem>7. Invite people to join the BikeBus or share the event</IonItem>
                                </IonList>
                            </IonCardContent>
                        </IonCard>
                    ) : (
                        <><IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>Creating a BikeBus</IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonList>
                                        <IonItem>1. <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/Login">LogIn</IonButton></IonItem>
                                        <IonItem>2. Create a Route:  <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/Help">Help</IonButton></IonItem>
                                        <IonItem>3. View the Route:  <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/ViewRouteList">View your Routes</IonButton></IonItem>
                                        <IonItem>4. Select the "Create BikeBus Group" button</IonItem>
                                        <IonItem>5. Fill in the "Create BikeBus" form</IonItem>
                                        <IonItem>6. Create your schedule of upcoming events</IonItem>
                                        <IonItem>7. Invite people to join the BikeBus or share the event</IonItem>
                                    </IonList>
                                </IonCardContent>
                            </IonCard><IonList>
                                    {BikeBus.map((BikeBus) => (
                                        <IonItem key="id">
                                            <IonLabel>{BikeBus.BikeBusName}</IonLabel>
                                            <IonButton shape="round" routerLink={`/bikebusgrouppage/${BikeBus.id}`}>View BikeBus</IonButton>
                                        </IonItem>
                                    ))}
                                </IonList></>
                    )}
                </IonCard>
            </IonContent>
        </IonPage >
    );
};

export default ViewBikeBusList;
