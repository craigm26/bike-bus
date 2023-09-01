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
    IonPopover,
    IonText,
    IonTitle,
    IonSelect,
    IonSelectOption,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import usePlacesAutocomplete from '../hooks/usePlacesAutocomplete';


interface BikeBus {
    BikeBusName: any;
    BikeBusDescription: any;
    BikeBusType: any;
    travelMode: any;
    startPoint: any;
    endPoint: any;
    pathCoordinates: any;
    id: string;
}

const EditBikeBus: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedBikeBus, setSelectedBikeBus] = useState<BikeBus | null>(null);
    const [BikeBus, setBikeBus] = useState<BikeBus[]>([]);
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const startPointRef = usePlacesAutocomplete((location, name) => { });
    const endPointRef = usePlacesAutocomplete((location, name) => { });



    const fetchBikeBus = useCallback(async () => {
        const uid = user?.uid;
        if (!uid) {
            return;
        }
        const BikeBusCollection = collection(db, 'BikeBus');
        const q = query(BikeBusCollection, where("BikeBusCreator", "==", `/users/${uid}`));
        const querySnapshot = await getDocs(q);
        const BikeBusData: BikeBus[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as BikeBus,
            id: doc.id,
        }));
        setBikeBus(BikeBusData);
    }, [user]);

    useEffect(() => {
        fetchBikeBus();
    }, [fetchBikeBus]);

    useEffect(() => {
        if (id) fetchSingleBikeBus(id);
    }, [id]);

    const fetchSingleBikeBus = async (id: string) => {
        const docRef = doc(db, 'bikebusgroups', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const BikeBusData = {
                ...docSnap.data() as BikeBus,
                id: docSnap.id,
            };
            setSelectedBikeBus(BikeBusData);
        }
    };

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


    const handleSave = async () => {
        if (!selectedBikeBus) {
            return;
        }
        console.log(selectedBikeBus);
        console.log(selectedBikeBus.id);
        console.log(selectedBikeBus.BikeBusName);
        const BikeBusRef = doc(db, 'bikebusgroups', selectedBikeBus.id);
        const updatedBikeBus: Partial<BikeBus> = {
            BikeBusName: selectedBikeBus.BikeBusName,
            BikeBusDescription: selectedBikeBus.BikeBusDescription,
            BikeBusType: selectedBikeBus.BikeBusType,
        };
        console.log(updatedBikeBus);
        await updateDoc(BikeBusRef, updatedBikeBus);
        alert('BikeBus Updated');
        history.push(`/bikebusgrouppage/${selectedBikeBus.id}`)
    };

    return (
        <IonPage className="ion-flex-offset-app">
        <IonContent fullscreen>
                <IonTitle>
                    Editing BikeBus
                </IonTitle>
                <IonList>
                    <IonItem>
                        <IonLabel>BikeBus Name:</IonLabel>
                        <IonInput value={selectedBikeBus?.BikeBusName} onIonChange={e => selectedBikeBus && setSelectedBikeBus({ ...selectedBikeBus, BikeBusName: e.detail.value! })} />
                    </IonItem>
                    <IonItem>
                        <IonLabel>Description:</IonLabel>
                        <IonInput value={selectedBikeBus?.BikeBusDescription} onIonChange={e => selectedBikeBus && setSelectedBikeBus({ ...selectedBikeBus, BikeBusDescription: e.detail.value! })} />
                    </IonItem>
                    <IonItem>
                        <IonLabel>BikeBus Type:</IonLabel>
                        <IonSelect value={selectedBikeBus?.BikeBusType} onIonChange={e => selectedBikeBus && setSelectedBikeBus({ ...selectedBikeBus, BikeBusType: e.detail.value })}>
                            <IonSelectOption value="Work">Work</IonSelectOption>
                            <IonSelectOption value="School">School</IonSelectOption>
                            <IonSelectOption value="Social">Social</IonSelectOption>
                            <IonSelectOption value="Club">Club</IonSelectOption>
                        </IonSelect>
                    </IonItem>
                </IonList>
                <IonButton onClick={handleSave}>Save</IonButton>
                <IonButton routerLink={`/bikebusgrouppage/${id}`}>Cancel</IonButton>
            </IonContent >
        </IonPage >
    );

};

export default EditBikeBus;
