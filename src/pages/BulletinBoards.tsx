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
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonSelect,
    IonSelectOption
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { DocumentReference, addDoc, arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, FieldValue } from 'firebase/firestore';
import useAuth from "../useAuth";
import Avatar from '../components/Avatar';
import './BulletinBoards.css';

interface Coordinate {
    lat: number;
    lng: number;
}

interface FirestoreRef {
    path: string;
}

interface Organization {
    id: string;
    NameOfOrg: string;
    accountType: string;
    groupType: string;
    description: string;
    OrganizationCreator: string;
    bulletinboard: FirestoreRef;
}

interface BikeBus {
    id: string;
    accountType: string;
    groupType: string;
    description: string;
    endPoint: Coordinate;
    BikeBusCreator: string;
    BikeBusLeader: string;
    BikeBusName: string;
    BikeBusType: string;
    startPoint: Coordinate;
    travelMode: string;
    bulletinboard: FirestoreRef;
}

interface SelectOption {
    value: string;
    label: string;
}

interface BulletinBoard {
    Messages: DocumentReference[];
}

interface Message {
    message: string;
    user: {
        id: string;
        username: string;
        avatarUrl: string;
    } | null;
    BikeBusGroup: DocumentReference | null;
    Organization: DocumentReference | null;
    timestamp: FieldValue;
    bulletinboard: DocumentReference;
}


const BulletinBoards: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setAccountType] = useState<string>('');
    const [groupType, setGroupType] = useState<string>('Organization');
    const [combinedList, setCombinedList] = useState<SelectOption[]>([]);
    const [selectedValue, setSelectedValue] = useState<string | undefined>('');
    const [groupId, setGroupId] = useState<string | undefined>('');
    const [groupData, setGroupData] = useState<any | undefined>(undefined);
    const [username, setUsername] = useState<string | undefined>('');
    const [messageInput, setMessageInput] = useState<string>('');
    const [messagesData, setMessagesData] = useState<Message[]>([]);

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
                        setAccountType(userData.accountType);
                    }
                    const username = userData?.username;
                    if (username) {
                        setUsername(username);
                    }
                } else {
                }
            });
        }

    }, [user]);

    useEffect(() => {
        if (selectedValue) {
            // Fetch from organizations and bikebusgroups in parallel
            const orgSnapshotPromise = getDoc(doc(db, 'organizations', selectedValue));
            const busSnapshotPromise = getDoc(doc(db, 'bikebusgroups', selectedValue));
    
            Promise.all([orgSnapshotPromise, busSnapshotPromise]).then(([orgSnapshot, busSnapshot]) => {
                if (orgSnapshot.exists()) {
                    const groupData = orgSnapshot.data();
                    if (groupData) {
                        setGroupData(groupData);
                        console.log('Org Data:', groupData);
                        console.log('Org ID:', selectedValue);
                        // find the bulletinboard for this org
                        const bulletinBoardRef = groupData.bulletinboard;
                        if (bulletinBoardRef) {
                            getDoc(bulletinBoardRef).then((bulletinBoardSnapshot) => {
                                if (bulletinBoardSnapshot.exists()) {
                                    const bulletinBoardData = bulletinBoardSnapshot.data();
                                    if (bulletinBoardData) {
                                        console.log('Org Bulletin Board Data:', bulletinBoardData);
                                        // show me the document reference for the id of the bulletinboard
                                        console.log('Org Bulletin Board ID:', bulletinBoardSnapshot.id);
                                    }
                                } else {
                                }
                            });
                        }
                    }
                } else if (busSnapshot.exists()) {
                    const groupData = busSnapshot.data();
                    if (groupData) {
                        setGroupData(groupData);
                        console.log('Bus Data:', groupData);
                        console.log('Bus ID:', selectedValue);
                    }
                }
            });
        }
    }, [selectedValue]);
    

    const fetchOrganizations = useCallback(async () => {
        let formattedData: { value: string, label: string }[] = [];
        try {
            const uid = user?.uid;
            console.log('UID:', uid);

            if (!uid) {
                return formattedData;
            }

            const userRef = doc(db, 'users', uid);
            const OrganizationCollection = collection(db, 'organizations');
            const q = query(OrganizationCollection, where('OrganizationMembers', 'array-contains', userRef));
            const querySnapshot = await getDocs(q);

            const OrganizationData: Organization[] = querySnapshot.docs.map(doc => ({
                ...doc.data() as Organization,
                id: doc.id,
            }));

            formattedData = OrganizationData.map(org => ({
                value: org.id,
                label: org.NameOfOrg
            }));

        } catch (error) {
            console.log("Error fetching organizations:", error);
        }

        return formattedData;

    }, [user]);


    const fetchBikeBus = useCallback(async () => {
        let formattedData: { value: string, label: string }[] = [];
        const uid = user?.uid;
        console.log('UID:', uid);

        if (!uid) {
            return formattedData;
        }

        const BikeBusCollection = collection(db, 'bikebusgroups');
        const q = query(BikeBusCollection, where('BikeBusMembers', 'array-contains', doc(db, 'users', `${user?.uid}`)));
        console.log('Query:', q);
        const querySnapshot = await getDocs(q);

        const BikeBusData: BikeBus[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as BikeBus,
            id: doc.id,
        }));

        formattedData = BikeBusData.map(bus => ({
            value: bus.id,
            label: bus.BikeBusName
        }));

        return formattedData;
    }, [user]);


    const fetchMessages = useCallback(async () => {
        if (groupData?.bulletinboard) {
            const bulletinBoardRef = doc(db, groupData.bulletinboard.path);
            const bulletinBoardDoc = await getDoc(bulletinBoardRef);

            if (bulletinBoardDoc.exists()) {
                const bulletinBoardData = bulletinBoardDoc.data() as BulletinBoard;
                const messagesData = bulletinBoardData?.Messages || [];

                const messagesPromises = messagesData.map(async (messageRef: DocumentReference) => {
                    const messageDoc = await getDoc(messageRef);
                    if (messageDoc.exists()) {
                        const messageData = messageDoc.data();

                        if (messageData?.user) {
                            const userDoc = await getDoc(messageData.user);
                            const userData = userDoc.data();

                            return {
                                ...messageData,
                                user: userData ? {
                                    ...userData,
                                    id: userDoc.id,
                                } : null,
                            };
                        } else {
                        }
                    } else {
                    }
                });

                const resolvedMessages = await Promise.all(messagesPromises);
                setMessagesData(resolvedMessages.filter((item): item is Message => Boolean(item)));

            } else {
            }
        } else {
        }
    }, [groupData]);


    useEffect(() => {
        if (groupType === 'BikeBus') {
            Promise.all([fetchBikeBus()]).then(([bikebus]) => {
                setCombinedList([...bikebus]);
            });
        } else {
            Promise.all([fetchOrganizations(), fetchBikeBus()]).then(([orgs, bikebus]) => {
                setCombinedList([...orgs, ...bikebus]);
            });
        }
    }, [groupType, fetchOrganizations, fetchBikeBus]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages, selectedValue]);

    const submitMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (messageInput.trim() === '' || !user || !avatarUrl) {
            return;
        }

        const bulletinBoardRef = doc(db, groupData.bulletinboard.path);
        const userRef = doc(db, 'users', user.uid);

        const messageRef = await addDoc(collection(db, 'messages'), {
            message: messageInput,
            user: userRef,
            timestamp: serverTimestamp(),
            bulletinboard: bulletinBoardRef,
        });

        await updateDoc(bulletinBoardRef, {
            Messages: arrayUnion(messageRef),
        });

        setMessageInput('');
        fetchMessages();
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    {headerContext?.showHeader && <IonHeader></IonHeader>}
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonCard>
                    {combinedList.length === 0 ? (
                        <IonCardContent>
                            <IonCardTitle>How to Read Bulletin Boards:</IonCardTitle>
                            <IonList>
                                <IonItem>1. <IonButton className="ion-button-profile" fill="solid" routerLink="/Login">LogIn</IonButton></IonItem>
                                <IonItem>2. Join a BikeBus <IonButton className="ion-button-profile" fill="solid" routerLink="/SearchForBikeBus">Search for BikeBus</IonButton> or Organization:  <IonButton className="ion-button-profile" fill="solid" routerLink="/SearchForOrganization">Search for Organization</IonButton></IonItem>
                            </IonList>
                        </IonCardContent>
                    ) : (
                        <IonCardContent>
                            <IonCardTitle>Bulletin Board</IonCardTitle>
                            <IonSelect
                                className="custom-ion-select"
                                value={selectedValue}
                                placeholder="Select Organization or BikeBus:"
                                onIonChange={e => setSelectedValue(e.detail.value)}
                            >
                                {combinedList.map((item, index) => (
                                    <IonSelectOption key={index} value={item.value}>
                                        {item.label}
                                    </IonSelectOption>
                                ))}
                            </IonSelect>
                            <IonList>
                                {messagesData && messagesData.length > 0 && messagesData
                                    .sort((b, a) => Number(b.timestamp) - Number(a.timestamp))
                                    .map((message, index) => {
                                        return (
                                            <IonItem key={index}>
                                                {username !== message?.user?.username && (
                                                    <Avatar uid={message?.user?.id} size='extrasmall' />
                                                )}
                                                <IonLabel className={username === message?.user?.username ? 'right-align' : 'left-align'}>
                                                    {message?.message}
                                                </IonLabel>
                                                {username === message?.user?.username && (
                                                    <Avatar uid={message?.user?.id} size='extrasmall' />
                                                )}
                                            </IonItem>
                                        );
                                    })}
                                {selectedValue && (
                                    <form onSubmit={submitMessage}>
                                        <IonInput
                                            value={messageInput}
                                            placeholder="Enter your message"
                                            onIonChange={e => setMessageInput(e.detail.value || '')}
                                        />
                                        <IonButton expand="full" type="submit">Post Bulletin Board Message</IonButton>
                                    </form>
                                )}
                            </IonList>
                        </IonCardContent>
                    )}
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default BulletinBoards;
