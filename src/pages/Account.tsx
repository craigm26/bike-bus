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
    IonItem,
    IonList,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonTitle,
    IonInput,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Account.css';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { personCircleOutline } from 'ionicons/icons';


const DEFAULT_ACCOUNT_MODES = ['Member'];

const Account: React.FC = () => {
    const { user, checkAndUpdateAccountModes } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const [showPopover, setShowPopover] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(null);
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [username, setusername] = useState<string>('');
    const [accountType, setaccountType] = useState<string>('');
    const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);

    const togglePopover = (e: any) => {
        setPopoverEvent(e.nativeEvent);
        setShowPopover((prevState) => !prevState);
    };

    useEffect(() => {
        if (user) {
            checkAndUpdateAccountModes(user.uid);
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    if (userData) {
                        if (userData.enabledAccountModes) {
                            setEnabledAccountModes(userData.enabledAccountModes);
                        } else {
                            setEnabledAccountModes(DEFAULT_ACCOUNT_MODES);
                            updateDoc(userRef, { enabledAccountModes: DEFAULT_ACCOUNT_MODES });
                        }

                        // Other user data checks
                    }
                    if (userData && userData.firstName) {
                        setFirstName(userData.firstName);
                    }

                    if (userData && userData.lastName) {
                        setLastName(userData.lastName);
                    }
                    if (userData && userData.username) {
                        setusername(userData.username);
                    }
                    if (userData && userData.accountType) {
                        setaccountType(userData.accountType);
                    }
                    if (userData && userData.enabledAccountModes) {
                        setEnabledAccountModes(userData.enabledAccountModes);
                    }
                }
            });
        }
    }, [user, checkAndUpdateAccountModes]);

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

    const label = user?.username ? user.username : 'anonymous';

    const saveUsername = async () => {
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { username: username });
        }
      };
      

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonText slot="start" color="primary" className="BikeBusFont">
                        <h1>BikeBus</h1>
                    </IonText>
                    <IonButton fill="clear" slot="end" onClick={togglePopover}>
                        <IonChip>
                            {avatarElement}
                            <IonLabel>{label}</IonLabel>
                            <IonText>({accountType})</IonText>
                        </IonChip>
                    </IonButton>
                    <IonPopover isOpen={showPopover} event={popoverEvent} onDidDismiss={() => setShowPopover(false)} className="my-popover">
                        <Profile />
                    </IonPopover>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonCard>
                    <IonCardHeader>
                        <IonTitle>{user?.username}</IonTitle>
                        <IonCardTitle>Account</IonCardTitle>
                    </IonCardHeader>
                    <Avatar uid={user?.uid} size="large" />
                    <IonItem>
                        <IonLabel>Account Type</IonLabel>
                        <IonText>{accountType}</IonText>
                    </IonItem>
                    <IonCardContent>
                        <IonList>
                            <IonItem>
                                <IonLabel>First Name</IonLabel>
                                <IonText>{firstName}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Last Name</IonLabel>
                                <IonText>{lastName}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel position="stacked">User Name</IonLabel>
                                <IonInput
                                    value={username}
                                    placeholder="Enter Username"
                                    onIonChange={e => setusername(e.detail.value!)}
                                />
                            </IonItem>
                            <IonButton onClick={saveUsername}>Save Username</IonButton>

                            <IonItem>
                                <IonLabel>Account Modes</IonLabel>
                                <IonText>{enabledAccountModes.join(', ')}</IonText>
                            </IonItem>
                        </IonList>
                    </IonCardContent>
                </IonCard>
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>BikeBus You Belong To</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonText>Display Name of Routes (BikeBusGroups) the Account is associated with</IonText>
                        <IonText>Link to the BikeBusGroup (Route, group message, group members, group leaders) Page</IonText>
                    </IonCardContent>
                </IonCard>
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>Notification Settings</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                    </IonCardContent>
                </IonCard>
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>Favorite Destinations</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                    </IonCardContent>
                </IonCard>
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>Parent</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonText>Add a Kid Account here</IonText>
                        <IonText>When a Kid is added, a table shows with the ability to associate a known route and schedule along with the phone device phone number to send invite</IonText>
                        <IonText>When a Kid attempts to login, a PIN code set by the parent is entered along with the account email address. This same PIN is used for the kid to login</IonText>
                        <IonText>When a Kid logs in, there's only a few visual indicators they're in the app. All they can do is "Start" and "Stop". Parents receive notifications about the ride.</IonText>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default Account;
