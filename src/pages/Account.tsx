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
    const { user } = useAuth();
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
          const userRef = doc(db, 'users', user.uid);
          getDoc(userRef).then((docSnapshot) => {
            if (docSnapshot.exists()) {
              const userData = docSnapshot.data();
              if (userData && userData.enabledAccountModes) {
                setEnabledAccountModes(userData.enabledAccountModes);
              } else {
                setEnabledAccountModes(DEFAULT_ACCOUNT_MODES);
                updateDoc(userRef, { enabledAccountModes: DEFAULT_ACCOUNT_MODES });
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

    const label = user?.username ? user.username : 'anonymous';

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
                                <IonLabel>User Name</IonLabel>
                                <IonText>{username}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Account Modes</IonLabel>
                                <IonText>{enabledAccountModes.join(', ')}</IonText>
                            </IonItem>
                        </IonList>
                    </IonCardContent>
                </IonCard>
            </IonContent>
            <IonPopover isOpen={showPopover} event={popoverEvent} onDidDismiss={() => setShowPopover(false)}>
                <Profile />
            </IonPopover>
        </IonPage>
    );
};

export default Account;
