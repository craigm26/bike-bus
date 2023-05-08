// src/pages/Account.tsx
import {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonMenuButton,
    IonButtons,
    IonButton,
    IonLabel,
    IonText,
    IonChip,
    IonAvatar,
    IonPopover,
    IonTitle,
    IonCheckbox,
    IonItem,
    IonList,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Account.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile'; // Import the Profile component
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';



const Account: React.FC = () => {
    const { user } = useAuth(); // Use the useAuth hook to get the user object
    const { avatarUrl } = useAvatar(user?.uid);
    const [showPopover, setShowPopover] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(null);
    const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);

    const toggleAccountMode = (mode: string) => {
        if (enabledAccountModes.includes(mode)) {
            setEnabledAccountModes(enabledAccountModes.filter((m) => m !== mode));
        } else {
            setEnabledAccountModes([...enabledAccountModes, mode]);
        }
    };


    const togglePopover = (e: any) => {
        console.log('togglePopover called');
        console.log('event:', e);
        setPopoverEvent(e.nativeEvent);
        setShowPopover((prevState) => !prevState);
        console.log('showPopover state:', showPopover);
    };

    useEffect(() => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    if (userData && userData.enabledAccountModes) {
                        setEnabledAccountModes(userData.enabledAccountModes);
                    }
                }
            });
        }
    }, [user]);



    useEffect(() => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            updateDoc(userRef, { enabledAccountModes });
        }
    }, [enabledAccountModes, user]);



    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonText color="primary" class="BikeBusFont">
                        <h1>BikeBus</h1>
                    </IonText>
                    <IonButton fill="clear" slot="end" onClick={togglePopover}>
                        <IonChip>
                            {avatarUrl && (
                                <IonAvatar>
                                    <Avatar uid={user?.uid} size="extrasmall" />
                                </IonAvatar>
                            )}
                            <IonLabel>{user?.displayName || user?.email}</IonLabel>
                        </IonChip>
                    </IonButton>
                    <IonPopover
                        isOpen={showPopover}
                        event={popoverEvent}
                        onDidDismiss={() => setShowPopover(false)}
                        className="my-popover"
                    >
                        <Profile />
                    </IonPopover>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">Account</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonButton>
                    <IonLabel>Return to Map</IonLabel>
                </IonButton>
                <IonContent fullscreen>
                    <IonHeader collapse="condense">
                        <IonToolbar>
                            <IonTitle size="large">Account</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonList>
                        <IonItem>
                            <IonLabel>Member</IonLabel>
                            <IonCheckbox
                                slot="end"
                                checked={enabledAccountModes.includes('Member')}
                                onIonChange={() => toggleAccountMode('Member')}
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel>Leader</IonLabel>
                            <IonCheckbox
                                slot="end"
                                checked={enabledAccountModes.includes('Leader')}
                                onIonChange={() => toggleAccountMode('Leader')}
                            />
                        </IonItem>
                        {/* ... (add other account modes in the same way) */}
                    </IonList>
                    <IonItem button routerLink="/Map" routerDirection="none">
                        <IonLabel>Return to Map</IonLabel>
                    </IonItem>
                </IonContent>

            </IonContent>
        </IonPage>
    );
};

export default Account;
