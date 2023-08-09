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
    IonSelectOption,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonCheckbox,
    IonRow,
    IonAvatar,
    IonIcon,
    IonTitle,
    IonAlert
} from '@ionic/react';
import { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { DocumentReference, addDoc, arrayUnion, collection, doc, orderBy, startAt, endAt, getDoc, getDocs, query, serverTimestamp, updateDoc, where, FieldValue, GeoPoint } from 'firebase/firestore';
import useAuth from "../useAuth";
import Avatar from '../components/Avatar';
import './BulletinBoards.css';
import * as geofire from 'geofire-common';
import { useCurrentLocation } from '../components/CurrentLocationContext';
import { DocumentData } from '@firebase/firestore-types';
import { personCircleOutline } from 'ionicons/icons';


interface Coordinate {
    lat: number;
    lng: number;
}

interface FirestoreRef {
    path: string;
}

interface User {
    id: string;
    username: string;
    avatarUrl: string;
    accountType: string;
}

interface UserLocation {
    lat: number;
    lng: number;
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
    BikeBusGroup?: DocumentReference | null;
    Organization?: DocumentReference | null;
    timestamp: FieldValue;
    bulletinboard: DocumentReference | string;
    geoHash?: string;
    userLocationSentMessage?: UserLocation;
}


const BulletinBoards: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const [accountType, setAccountType] = useState<string>('');
    const [groupType, setGroupType] = useState<string>('Organization');
    const [combinedList, setCombinedList] = useState<SelectOption[]>([]);
    const [selectedValue, setSelectedValue] = useState<string>("Community");
    const [groupId, setGroupId] = useState<string | undefined>('');
    const [groupData, setGroupData] = useState<any | undefined>(undefined);
    const [username, setUsername] = useState<string | undefined>('');
    const [messageInput, setMessageInput] = useState<string>('');
    const [messagesData, setMessagesData] = useState<Message[]>([]);
    const [postToCommunity, setPostToCommunity] = useState(false);
    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
    const [geoConsent, setGeoConsent] = useState<boolean>(false);
    const [showAlert, setShowAlert] = useState(true);
    const [anonAccess, setAnonAccess] = useState(false);


    async function searchNext($event: CustomEvent<void>) {
        fetchMessages({ lat: 0, lng: 0 });

        ($event.target as HTMLIonInfiniteScrollElement).complete();
    }

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

        if (accountType === 'Anonymous') {
            setAnonAccess(true);
        }

    }, [user]);

    const avatarElement = useMemo(() => {
        return user ? (
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
    }, [user, avatarUrl]);


    const transformCommunityMessages = (communityMessages: DocumentData[]): Message[] => {

        return communityMessages.map((doc) => {
            const messageData = doc.data();
            return {
                message: messageData.message,
                user: messageData.user,
                BikeBusGroup: messageData.BikeBusGroup,
                Organization: messageData.Organization,
                timestamp: messageData.timestamp,
                bulletinboard: messageData.bulletinboard,
            };
        });
    };

    const handleCommunitySelection = async () => {
        if (geoConsent === true) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    const userLocation = { lat: latitude, lng: longitude };
                    console.log('User Location:', userLocation);

                    const communityMessagesRef = collection(db, 'messages');
                    const communityMessagesQuery = query(communityMessagesRef, where('bulletinboard', '==', 'Community'));
                    const communityMessagesSnapshot = await getDocs(communityMessagesQuery);
                    console.log('Community Messages Snapshot:', communityMessagesSnapshot)
                    console.log('bullentinboard:', communityMessagesSnapshot.docs[0].data().bulletinboard)
                    const communityMessagesData = communityMessagesSnapshot.docs.map(doc => ({
                        ...doc.data(),
                        id: doc.id,
                        message: doc.data().message as string,
                        timestamp: doc.data().timestamp as FieldValue,
                        user: doc.data().user.path,
                        bulletinboard: doc.data().bulletinboard || "Community",
                        geoHash: doc.data().geoHash as string,
                        userLocationSentMessage: doc.data().userLocationSentMessage as UserLocation,
                    }));


                    console.log('Community Messages Data:', communityMessagesData);

                    // Find community boards from the communityMessagesData that are within 25-mile radius
                    const communityMessages = communityMessagesData.filter((message) => {
                        const messageLocation = message.userLocationSentMessage as UserLocation;
                        const distanceInKm = geofire.distanceBetween([messageLocation.lat, messageLocation.lng], [userLocation.lat, userLocation.lng]);
                        const distanceInM = distanceInKm * 1000;
                        const radiusInM = 25 * 1609.34; // Convert miles to meters if radius is in miles
                        return distanceInM <= radiusInM;
                    });
                    //const communityMessages = await findCommunityMessagesWithinRadius(userLocation, 25);
                    console.log('Community Messages:', communityMessages);

                    // Transform communityMessages to match Message[] type
                    const transformedMessages = communityMessagesData.map((doc) => ({
                        message: doc.message,
                        user: doc.user,
                        timestamp: doc.timestamp,
                        bulletinboard: doc.bulletinboard,
                        geoHash: doc.geoHash,
                        userLocationSentMessage: doc.userLocationSentMessage,
                    }));

                    // Update the messagesData state with the transformed community messages
                    setMessagesData(transformedMessages);
                });
            }
        }
    };

    useEffect(() => {
        if (selectedValue) {
            if (selectedValue === 'Community') {
                // Handle community messages
                handleCommunitySelection();
            } else {
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

    const findCommunityMessagesWithinRadius = async (userLocation: { lat: number, lng: number }, radius: number) => {
        // Convert the user location to the expected array format
        const center: geofire.Geopoint = [userLocation.lat, userLocation.lng];
        const radiusInM = radius * 1609.34; // Convert miles to meters if radius is in miles

        const bounds = geofire.geohashQueryBounds(center, radiusInM);
        const promises = [];
        for (const b of bounds) {
            const q = query(
                collection(db, 'messages'), // Change 'cities' to 'messages' or your specific collection
                orderBy('geohash'),
                startAt(b[0]),
                endAt(b[1])
            );

            promises.push(getDocs(q));
        }

        // Collect all the query results together into a single list
        const snapshots = await Promise.all(promises);

        const matchingDocs = [];
        for (const snap of snapshots) {
            for (const doc of snap.docs) {
                const lat = doc.get('lat');
                const lng = doc.get('lng');

                // Filter out false positives due to GeoHash accuracy
                const distanceInKm = geofire.distanceBetween([lat, lng], center);
                const distanceInM = distanceInKm * 1000;
                if (distanceInM <= radiusInM) {
                    matchingDocs.push(doc.data()); // Change this to fit your needs
                }
            }
        }

        return matchingDocs; // Return the results as needed
    };

    const fetchMessages = useCallback(async (userLocation: { lat: number; lng: number; }) => {

        if (selectedValue === 'Community') {

            findCommunityMessagesWithinRadius(userLocation, 25)
                .then((communityMessages) => {
                    const transformedMessages = communityMessages.map(doc => ({
                        message: doc.message,
                        user: doc.user,
                        timestamp: doc.timestamp,
                        bulletinboard: doc.bulletinboard,
                        geoHash: doc.geoHash,
                        userLocationSentMessage: doc.userLocationSentMessage,
                    }));
                    setMessagesData(transformedMessages);
                });


        } else if (groupData?.bulletinboard) {
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


    const { startPoint } = useCurrentLocation();
    const latitude = startPoint.lat;
    const longitude = startPoint.lng;

    const getBulletinBoardInfoFromDocRef = (bulletinBoardRef: DocumentReference | null) => {
        if (!bulletinBoardRef) return null; // Handle null case

        // Assuming bulletinBoardRef contains a path to the bulletin board document
        const bulletinBoardPath = bulletinBoardRef.path;

        // Extract relevant information from the path or other properties of the reference
        // This logic would depend on the structure of your data and what you want to display
        const bulletinBoardName = extractBulletinBoardNameFromPath(bulletinBoardPath);

        // Return the information as a string or other format to be displayed in the UI
        return `Bulletin Board: ${bulletinBoardName}`;
    };

    const extractBulletinBoardNameFromPath = (bulletinBoardPath: string) => {
        // Assuming bulletinBoardPath is in the format "organizations/{orgId}/bulletinboards/{bulletinBoardId}"
        const bulletinBoardId = bulletinBoardPath.split('/')[3];
        return bulletinBoardId;
    };


    useEffect(() => {
        const communityOption = { value: "Community", label: "Community" };

        if (geoConsent) {
            if (groupType === 'BikeBus') {
                Promise.all([fetchBikeBus()]).then(([bikebus]) => {
                    setCombinedList([communityOption, ...bikebus]);
                });
            } else if (groupType === 'Community') {
                findCommunityMessagesWithinRadius({ lat: latitude, lng: longitude }, 25)
                    .then((communityMessages) => {
                        const transformedCommunityMessages = communityMessages.map(doc => ({
                            value: doc.id,
                            label: doc.message
                        }));

                        Promise.all([fetchBikeBus()]).then(([bikebus]) => {
                            setCombinedList([communityOption, ...bikebus, ...transformedCommunityMessages]);
                        });
                    });
            } else {
                Promise.all([fetchOrganizations(), fetchBikeBus()]).then(([orgs, bikebus]) => {
                    setCombinedList([communityOption, ...orgs, ...bikebus]);
                });
            }
        } else {
            Promise.all([fetchOrganizations(), fetchBikeBus()]).then(([orgs, bikebus]) => {
                setCombinedList([...orgs, ...bikebus]);
            });

        }



        fetchMessages({ lat: latitude, lng: longitude });


    }, [fetchBikeBus, fetchOrganizations, groupType, selectedValue, latitude, longitude, fetchMessages, selectedValue]);

    const submitMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        // first check to see what selectedValue is set to. If it is set to Community, then we need to post to the community board only
        // If it is set to an organization or bikebus, then we need to post to that board only
        // If it is set to nothing, then we need to post to the community board only

        console.log('Selected Value:', selectedValue);

        if (selectedValue === 'Community') {
            // Post to the community board only
            await postToCommunityBoard();
            setMessageInput('');
            setPostToCommunity(false); // Reset the community board selection
            // fetchMessages with userLocation
            fetchMessages({ lat: latitude, lng: longitude });
            return;
        }

        if (selectedValue === '') {
            // Post to the community board only
            await postToCommunityBoard();
            setMessageInput('');
            setPostToCommunity(false); // Reset the community board selection
            // fetchMessages with out userLocation
            fetchMessages({ lat: 0, lng: 0 });
            return;
        }

        if (selectedValue !== 'Comunnity' && selectedValue !== '') {

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

            // If the user selected to post to the community board, call the appropriate function
            if (postToCommunity) {
                await postToCommunityBoard();
            }

            setMessageInput('');
            setPostToCommunity(false); // Reset the community board selection
            fetchMessages({ lat: latitude, lng: longitude });
        }
    };

    // whenever a user posts a message, we need to add it to the community board when the selects the checkbox next to the send button
    const postToCommunityBoard = async () => {
        // Get the user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const userLocation = { lat: latitude, lng: longitude };
                console.log('User Location:', userLocation);

                // Add the message to the messages document collection
                const messageRef = await addDoc(collection(db, 'messages'), {
                    message: messageInput,
                    user: doc(db, 'users', `${user?.uid}`),
                    timestamp: serverTimestamp(),
                    bulletinboard: 'Community',
                    userLocationSentMessage: userLocation,
                    geoHash: geofire.geohashForLocation([userLocation.lat, userLocation.lng]),
                });
                console.log(messageRef)
            }
            );
        }
    };

    // let's create a conditional rendering mechanism that will render the "Community" once the user agrees to getLocation and then we will render the organizations and bikebusgroups once the user selects the organization or bikebusgroup from the dropdown
    const isGeoLocationAvailable = navigator.geolocation ? true : false;

    const getLocation = () => {
        if (isGeoLocationAvailable) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const userLocation = { lat: latitude, lng: longitude };

                setGeoConsent(true);
                console.log('User Location:', userLocation);
                fetchMessages(userLocation);
                findCommunityMessagesWithinRadius(userLocation, 25)

            });
        } else {
            console.log('GeoLocation is not available');
            setGeoConsent(false);
        }
    };



    return (
        <IonPage className="ion-flex-offset-app">
            <IonContent fullscreen>
                <IonCardTitle>Bulletin Boards</IonCardTitle>
                <IonButton
                    onClick={() => {
                        setGeoConsent(true);
                        getLocation();
                    }}
                >
                    Share Location to Enable Community Boards
                </IonButton>
                {!geoConsent && !anonAccess && (
                    <>
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
                        <IonList className="chat-list">
                            {messagesData.map((message, index) => {
                                let bulletinBoardInfo: ReactNode;
                                if (typeof message.bulletinboard !== 'string') {
                                    bulletinBoardInfo = getBulletinBoardInfoFromDocRef(message.bulletinboard);
                                }
                                return (
                                    <IonItem key={index} className={username === message?.user?.username ? 'chat-item-right' : 'chat-item-left'}>
                                        {username !== message?.user?.username && avatarElement}
                                        <IonLabel className="chat-message">
                                            {message?.message}
                                        </IonLabel>
                                        {username === message?.user?.username && avatarElement}
                                    </IonItem>
                                );
                            })}
                        </IonList>
                    </>
                )}
                {geoConsent && !anonAccess && (
                    <>
                        <IonSelect
                            className="custom-ion-select"
                            value={selectedValue}
                            placeholder="Select Organization, BikeBus or Community:"
                            onIonChange={e => setSelectedValue(e.detail.value)}
                        >
                            {combinedList.map((item, index) => (
                                <IonSelectOption key={index} value={item.value}>
                                    {item.label}
                                </IonSelectOption>
                            ))}
                        </IonSelect>
                        <IonList className="chat-list">
                            {messagesData.map((message, index) => {
                                let bulletinBoardInfo: ReactNode;
                                if (selectedValue === 'Community') {
                                    bulletinBoardInfo = message.bulletinboard as string;
                                } else if (typeof message.bulletinboard !== 'string') {
                                    bulletinBoardInfo = getBulletinBoardInfoFromDocRef(message.bulletinboard);
                                }
                                return (
                                    <IonItem key={index} className={username === message?.user?.username ? 'chat-item-right' : 'chat-item-left'}>
                                        {username !== message?.user?.username && avatarElement}
                                        <IonLabel className="chat-message">
                                            {message?.message}
                                        </IonLabel>
                                        {username === message?.user?.username && avatarElement}
                                    </IonItem>
                                );
                            })}
                        </IonList>
                    </>
                )}
                <form onSubmit={submitMessage} className="chat-input-form">
                    <IonInput
                        required={true}
                        value={messageInput}
                        placeholder="Enter your message"
                        onIonChange={e => setMessageInput(e.detail.value || '')}
                    />
                    {selectedValue !== 'Community' && (
                        <IonLabel>
                            Post to Community Board?
                            <IonCheckbox slot="start" checked={postToCommunity} onIonChange={e => setPostToCommunity(e.detail.checked)} />
                        </IonLabel>
                    )}
                    <IonRow className="chat-button-row">
                        <IonButton type="submit">Post Bulletin Board Message</IonButton>
                    </IonRow>
                </form>
                <IonInfiniteScroll threshold="100px" disabled={disableInfiniteScroll}
                    onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
                    <IonInfiniteScrollContent
                        loadingText="Loading more messages...">
                    </IonInfiniteScrollContent>
                </IonInfiniteScroll>

            </IonContent>
        </IonPage>
    );
};

export default BulletinBoards;
