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
    IonText,
    IonCard,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { collection, doc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import useAuth from "../useAuth";
import { GeoPoint } from 'firebase/firestore';
import { useParams } from 'react-router-dom';


interface Schedule {
    id: string;
    accountType: string;
}

const ViewSchedule: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [popoverState, setPopoverState] = useState<{ open: boolean; event: Event | null }>({ open: false, event: null });
    const { id } = useParams<{ id: string }>();


    const fetchSchedules = useCallback(async () => {
        // Assuming that your uid is stored in the user.uid
        const uid = user?.uid;

        if (!uid) {
            // If there's no user, we cannot fetch schedules
            return;
        }
        // from the url of the page, get the schedule id after the /viewschedule/ part of the url

        // Create a reference to the 'schedules' collection
        const schedulesCollection = collection(db, 'schedules');

        // Create a query against the collection.
        // This will fetch the document where the schedule id from the url equals the schedule's document id in firestore
        const q = query(schedulesCollection, where("id", "==", `${id}`));

        const querySnapshot = await getDocs(q);
        const schedulesData: Schedule[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as Schedule,
            id: doc.id,
        }));
        fetchSchedules();
    }, [user]); // here user is a dependency





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
                    </IonList>

                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default ViewSchedule;
