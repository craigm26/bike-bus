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
    IonCheckbox,
    IonItem,
    IonList,
    IonIcon,
    IonMenuToggle,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Account.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile'; // Import the Profile component
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { personCircleOutline } from 'ionicons/icons';
import AccountModeSelector from '../components/AccountModeSelector';

const DEFAULT_ACCOUNT_MODES = ['Member']; // Define the default account modes


const Account: React.FC = () => {
    const { user } = useAuth(); // Use the useAuth hook to get the user object
    const { avatarUrl } = useAvatar(user?.uid);
    const [showPopover, setShowPopover] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(null);
    const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);

    const toggleAccountMode = async (mode: string) => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);

            if (enabledAccountModes.includes(mode)) {
                setEnabledAccountModes(enabledAccountModes.filter((m) => m !== mode));
                await updateDoc(userRef, { enabledAccountModes: arrayRemove(mode) });
            } else {
                setEnabledAccountModes([...enabledAccountModes, mode]);
                await updateDoc(userRef, { enabledAccountModes: arrayUnion(mode) });
            }
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
                    } else {
                        setEnabledAccountModes(DEFAULT_ACCOUNT_MODES); // Set the default account modes
                        updateDoc(userRef, { enabledAccountModes: DEFAULT_ACCOUNT_MODES }); // Update the database with the default account modes
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

    const label = user?.displayName ? user.displayName : "anonymous";

    const [accountMode, setAccountMode] = useState<string[]>([]);

    const onAccountModeChange = (mode: string[]) => {
        setAccountMode(mode);
    };

    const enabledModes = [
        'Member',
        'Leader',
        'Parent',
        'Kid',
        'Car Driver',
        'Org Admin',
        'App Admin',
    ];

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonText slot="start" color="primary" class="BikeBusFont">
                        <h1>BikeBus</h1>
                    </IonText>
                    <AccountModeSelector
                        enabledModes={enabledModes}
                        value={accountMode}
                        onAccountModeChange={onAccountModeChange}
                    />
                    <IonButton fill="clear" slot="end" onClick={togglePopover}>
                        <IonChip>
                            {avatarElement}
                            <IonLabel>{label}</IonLabel>
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
                <IonText>
                    <h1>Account</h1>
                    <IonLabel>UserName: value for username:""</IonLabel>
                    <IonLabel>Account ID: value for users document id</IonLabel>
                    <IonLabel>Account Type:</IonLabel>
                    <IonLabel>UserID: value for uid</IonLabel>
                    <IonLabel>Google Account User ID:</IonLabel>
                    <IonLabel>Email Account User ID:</IonLabel>
                    <IonLabel>:</IonLabel>
                </IonText>
                <IonText>
                    <h2>Default Map Mode: Member</h2>
                </IonText>
                <IonText>
                    <h2>Enabled Account Modes:</h2>
                </IonText>
                <IonList>
                    <IonItem>
                        <IonLabel slot="start">Member</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Member')}
                            onIonChange={() => toggleAccountMode('Member')}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">Leader</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Leader')}
                            onIonChange={() => toggleAccountMode('Leader')}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">Parent</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Parent')}
                            onIonChange={() => toggleAccountMode('Parent')}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">Kid</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Kid')}
                            onIonChange={() => toggleAccountMode('Kid')}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">Car Driver</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Car Driver')}
                            onIonChange={() => toggleAccountMode('Car Driver')}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">Org Admin</IonLabel>
                        <IonLabel>Organization:</IonLabel>
                        <IonLabel>Organization Location:</IonLabel>
                        <IonLabel>Saved as BikeBus Destination type: School</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Org Admin')}
                            onIonChange={() => toggleAccountMode('Org Admin')}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">App Admin</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('App Admin')}
                            onIonChange={() => toggleAccountMode('App Admin')}
                        />
                    </IonItem>
                </IonList>
                <IonText>
                    <h2>Available Map Modes:</h2>
                </IonText>
                <IonMenuToggle>
                    <IonItem>
                        <IonLabel slot="start">Member</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Member')}
                            onIonChange={() => toggleAccountMode('Member')}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">Leader</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Leader')}    
                            onIonChange={() => toggleAccountMode('Leader')} 
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">Parent</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Parent')}    
                            onIonChange={() => toggleAccountMode('Parent')}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">Kid</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Kid')}
                            onIonChange={() => toggleAccountMode('Kid')}    
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">Car Driver</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Car Driver')}
                            onIonChange={() => toggleAccountMode('Car Driver')}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">Org Admin</IonLabel>
                        <IonLabel>Organization:</IonLabel>
                        <IonLabel>Organization Location:</IonLabel>
                        <IonLabel>Saved as BikeBus Destination type: School</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('Org Admin')}
                            onIonChange={() => toggleAccountMode('Org Admin')}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel slot="start">App Admin</IonLabel>
                        <IonCheckbox
                            slot="start"
                            checked={enabledAccountModes.includes('App Admin')}
                            onIonChange={() => toggleAccountMode('App Admin')}
                        />
                    </IonItem>
                </IonMenuToggle>
            </IonContent>
            <IonPopover
                isOpen={showPopover}
                event={popoverEvent}
                onDidDismiss={() => setShowPopover(false)}
            >
                <Profile />
            </IonPopover>
        </IonPage>
    );
};

export default Account;

