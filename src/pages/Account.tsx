import {
    IonContent,
    IonPage,
    IonButton,
    IonLabel,
    IonText,
    IonItem,
    IonList,
    IonCardContent,
    IonCardTitle,
    IonTitle,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonHeader,
    IonToolbar,
} from '@ionic/react';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { db, storage } from '../firebaseConfig';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ref, uploadBytesResumable } from '@firebase/storage';
import { cogOutline } from 'ionicons/icons';
import { AuthContext } from '../AuthContext';
import { useHistory } from 'react-router-dom';
import moment from 'moment-timezone';


interface Group {
    id: string;
    BikeBusName: string;
    BikeBusMembers: string[];
}

interface Coordinate {
    lat: number;
    lng: number;
}

interface Route {
    id: string;
    accountType: string;
    description: string;
    endPoint: Coordinate;
    routeCreator: string;
    routeLeader: string;
    routeName: string;
    routeType: string;
    startPoint: Coordinate;
    travelMode: string;
}

const DEFAULT_ACCOUNT_MODES = ['Member'];

const Account: React.FC = () => {
    const { user, loadingAuthState } = useContext(AuthContext);
    const { avatarUrl, refresh } = useAvatar(user?.uid);
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [selectedTimezone, setSelectedTimezone] = useState<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [accountType, setAccountType] = useState<string>('');
    const [timezone, setTimezone] = useState<string>('');
    const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
    const [BikeBusGroups, setBikeBusGroups] = useState<Group[]>([]);
    const [savedDestinations, setSavedDestinations] = useState<Group[]>([]);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [routes, setRoutes] = useState<Route[]>([]);
    const history = useHistory();




    useEffect(() => {
        if (!loadingAuthState && !user) {
            history.push('/login');
            return;
        }
        const fetchUser = async () => {
            try {
                if (user?.uid) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setFirstName(userData.firstName);
                        setLastName(userData.lastName);
                        setUsername(userData.username);
                        setAccountType(userData.accountType);
                        setEnabledAccountModes(userData.enabledAccountModes || DEFAULT_ACCOUNT_MODES);
                        setBikeBusGroups(userData.BikeBusGroups || []);
                        setSavedDestinations(userData.savedDestinations || []);
                        setSelectedTimezone(userData.timezone || '');
                        setSelectedLanguage(userData.preferredLanguage || '');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            }
        };
        fetchUser();
    }, [user, loadingAuthState]);

    const fetchRoutes = useCallback(async () => {
        try {
            if (user?.uid) {
                const routesCollectionRef = collection(db, 'routes');
                const q = query(routesCollectionRef, where("routeCreator", "==", user.uid));
                const querySnapshot = await getDocs(q);
                const routesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Route[];
                setRoutes(routesData);
            }
        } catch (error) {
            console.error("Failed to fetch routes:", error);
        }
    }, [user]);

    useEffect(() => {
        fetchRoutes();
    }, [fetchRoutes]);

    const currentTimeInTimezone = selectedTimezone ? moment.tz(selectedTimezone).format('YYYY-MM-DD HH:mm:ss z') : '';

    // find routes wiht the current user.uid as the routeLeader or the routeCreator. These are the routes that the user can edit, view or delete
    const isUserLeader = routes.some((route) => route.routeLeader === `/users/${user?.uid}` || route.routeCreator === `/users/${user?.uid}`);

    const refreshAvatar = () => {
        if (user) {
            refresh(); // Use refresh function returned by useAvatar
            setTimeout(() => refreshAvatar(), 1000);
        }
    };
    // Update the user's avatar
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (user && user.uid && event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const storageRef = ref(storage, `avatars/${user.uid}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot: any) => {
                    console.log('Upload progress:', (snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                },
                (error: any) => {
                    console.error('Error uploading avatar:', error);
                },
                () => {
                    // Notify useAvatar to update the avatar URL
                    refresh();
                },
            );
        }
    };

    return (

        <IonPage className="ion-flex-offset-app">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Account</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>                
            <IonCardTitle>{user?.username}</IonCardTitle>
                <IonGrid>
                    <IonRow className="ion-justify-content-center">
                        <IonCol size="auto">
                            <IonButton shape="round" fill="clear" onClick={() => fileInputRef.current?.click()}>
                                <Avatar uid={user?.uid} size="large" />
                            </IonButton>
                        </IonCol>
                    </IonRow>
                </IonGrid>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileInputChange}
                />
                <IonGrid>
                    <IonRow className="ion-justify-content-center">
                        <IonButton shape="round" className="ion-button-profile" routerLink='/settings'>
                            Settings
                            <IonIcon slot="end" icon={cogOutline}></IonIcon>
                        </IonButton>
                        <IonButton shape="round" className="ion-button-profile" routerLink='/SetUserDetails'>
                            Update User Details
                        </IonButton>
                    </IonRow>
                </IonGrid>
                <IonCardContent>
                    <IonList>
                        <IonItem>
                            <IonLabel position="stacked">First Name</IonLabel>
                            <IonText>{firstName}</IonText>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Last Name</IonLabel>
                            <IonText>{lastName}</IonText>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">User Name</IonLabel>
                            <IonText>{username}</IonText>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Email</IonLabel>
                            <IonText>{user?.email}</IonText>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Account Type</IonLabel>
                            <IonText>{accountType}</IonText>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Account Modes</IonLabel>
                            <IonText>{enabledAccountModes.join(', ')}</IonText>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Time Zone</IonLabel>
                            <IonText>{selectedTimezone}</IonText>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Language</IonLabel>
                            <IonText>{selectedLanguage}</IonText>
                        </IonItem>
                    </IonList>
                    <IonButton shape="round" color="danger" className="ion-button-profile" routerLink='/DeleteAccount'>
                        Delete Account
                    </IonButton>
                </IonCardContent>
            </IonContent>
        </IonPage>
    );
};

export default Account;
