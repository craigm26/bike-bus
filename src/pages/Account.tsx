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
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Account.css';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { db, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import React from 'react';
import { ref, uploadBytesResumable } from '@firebase/storage';
import { refresh } from 'ionicons/icons';

interface Group {
    id: string;
    BikeBusName: string;
    BikeBusMembers: string[];
}

const DEFAULT_ACCOUNT_MODES = ['Member'];

const Account: React.FC = () => {
    const { user, checkAndUpdateAccountModes } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [passwordConfirm, setPasswordConfirm] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [accountType, setaccountType] = useState<string>('');
    const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
    const [BikeBusGroups, setBikeBusGroups] = useState<Group[]>([]);
    const [savedDestinations, setSavedDestinations] = useState<Group[]>([]);



    useEffect(() => {
        if (user) {
            checkAndUpdateAccountModes(user.uid);
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    // Get the BikeBusGroups
                    const q = query(collection(db, 'bikebusgroups'), where('BikeBusMembers', 'array-contains', doc(db, 'users', `${user.uid}`)));

                    getDocs(q).then((querySnapshot) => {
                        const groups = querySnapshot.docs.map((doc) => ({
                            id: doc.id,
                            BikeBusName: doc.data().BikeBusName,  // assuming the document has a field named 'BikeBusName'
                            BikeBusMembers: doc.data().BikeBusMembers, // assuming the document has a field named 'BikeBusMembers'
                        }));
                        setBikeBusGroups(groups);
                    });


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
                        setUsername(userData.username);
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


    const refresh = () => {
        // Refresh the avatar
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
        <IonPage>
            <IonContent fullscreen>
                <IonCard className="ion-justify-content-center">
                    <IonCardHeader>
                        <IonTitle>{user?.username}</IonTitle>
                        <IonCardTitle>Account</IonCardTitle>
                    </IonCardHeader>
                    <Avatar uid={user?.uid} size="large" />
                    <IonButton fill="clear" onClick={(_handleFileInputChange) => fileInputRef.current?.click()}>
                        Update Avatar
                    </IonButton>
                    <IonItem>
                        <IonLabel>Account Type</IonLabel>
                        <IonText>{accountType}</IonText>
                    </IonItem>
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
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>BikeBus You Belong To</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        {BikeBusGroups.map((group, index) => (
                            <div key={group.id}>
                                <Link to={`/bikebusgrouppage/${group.id}`}>
                                    {group.BikeBusName}
                                </Link>
                            </div>
                        ))}
                    </IonCardContent>
                </IonCard>
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>BikeBus Routes you created</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <Link to="/ViewRouteList">View Routes</Link>
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
                        {savedDestinations.map((destination, index) => (
                            <div key={destination.id}>
                                <Link to={`/map/${destination.id}`}>
                                    {destination.id}
                                </Link>
                            </div>
                        ))}
                    </IonCardContent>
                </IonCard>
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>Parent</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonText>Add a Kid Account here</IonText>
                        <IonText>When a Kid logs in, there's only a few visual indicators they're in the app. All they can do is "Start" and "Stop". Parents receive notifications about the ride.</IonText>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default Account;
