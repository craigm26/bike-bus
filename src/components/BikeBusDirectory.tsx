import {
    IonContent,
    IonPage,
    IonItem,
    IonList,
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

const BikeBusDirectory: React.FC = () => {
    const { user } = useAuth();
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [BikeBus, setBikeBus] = useState<BikeBus[]>([]);

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
                <IonList>
                    {BikeBus.map((BikeBus) => (
                        <IonItem key="id">
                            <IonLabel>{BikeBus.BikeBusName}</IonLabel>
                            <IonButton routerLink={`/bikebusgrouppage/${BikeBus.id}`}>View BikeBus</IonButton>
                        </IonItem>
                    ))}
                </IonList>

    );
};

export default BikeBusDirectory;
