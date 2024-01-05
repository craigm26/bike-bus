import {
    IonContent,
    IonPage,
    IonButton,
    IonLabel,
    IonText,
    IonItem,
    IonList,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonTitle,
    IonIcon,
} from '@ionic/react';
import './Account.css';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { db, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ref, uploadBytesResumable } from '@firebase/storage';
import { cogOutline } from 'ionicons/icons';
import { AuthContext } from '../AuthContext';
import { useHistory } from 'react-router-dom';


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
    const [accountType, setaccountType] = useState<string>('');
    const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
    const [BikeBusGroups, setBikeBusGroups] = useState<Group[]>([]);
    const [savedDestinations, setSavedDestinations] = useState<Group[]>([]);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [routes, setRoutes] = useState<Route[]>([]);
    const history = useHistory();



    useEffect(() => {

        if (!loadingAuthState && !user) {
            // Redirect to login if not loading and no user
            history.push('/login');
            return;
        }
        const fetchUser = async () => {
            if (user?.uid) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();
                if (userData) {
                    setFirstName(userData.firstName);
                    setLastName(userData.lastName);
                    setUsername(userData.username);
                    setaccountType(userData.accountType);
                    setEnabledAccountModes(userData.enabledAccountModes || DEFAULT_ACCOUNT_MODES);
                    setBikeBusGroups(userData.BikeBusGroups);
                    setSavedDestinations(userData.savedDestinations);
                }
            }
        };
        fetchUser();

      }, [user, loadingAuthState]);
        

    const fetchRoutes = useCallback(async () => {
        // Assuming that your uid is stored in the user.uid
        const uid = user?.uid;

        if (!uid) {
            // If there's no user, we cannot fetch routes
            return;
        }

        // Create a reference to the 'routes' collection
        const routesCollection = collection(db, 'routes');

        // Create a query against the collection.
        // This will fetch all documents where the routeCreator equals the user's uid
        const q = query(routesCollection, where("routeCreator", "==", `/users/${uid}`));

        const querySnapshot = await getDocs(q);
        const routesData: Route[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as Route,
            id: doc.id,
        }));
        setRoutes(routesData);
    }, [user]); // here user is a dependency

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
            <IonContent fullscreen>
                <IonCard className="ion-justify-content-center">
                    <IonCardHeader>
                        <IonTitle>{user?.username}</IonTitle>
                        <IonCardTitle>Account</IonCardTitle>
                    </IonCardHeader>
                    <Avatar uid={user?.uid} size="large" />
                    <IonButton fill="clear" onClick={() => fileInputRef.current?.click()}>
                        Update Avatar
                    </IonButton>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleFileInputChange}
                    />
                    <IonItem>
                        <IonLabel>Account Type</IonLabel>
                        <IonText>{accountType}</IonText>
                    </IonItem>
                    <IonButton className="ion-button-profile" routerLink='/settings'>
                        Settings
                        <IonIcon slot="end" icon={cogOutline}></IonIcon>
                    </IonButton>
                    <IonButton routerLink='/SetUsername'>
                        Set Username
                    </IonButton>
                    <IonButton routerLink='/DeleteAccount'>
                        Delete Account
                    </IonButton>
                    <IonButton routerLink='/SetLanguage'>
                        Set Language
                    </IonButton>
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
                                <IonLabel position="stacked">Account Modes</IonLabel>
                                <IonText>{enabledAccountModes.join(', ')}</IonText>
                            </IonItem>
                        </IonList>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default Account;
