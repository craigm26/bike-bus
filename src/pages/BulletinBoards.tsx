import {
    IonContent,
    IonPage,
    IonItem,
    IonList,
    IonInput,
    IonLabel,
    IonButton,
    IonCardTitle,
    IonSelect,
    IonSelectOption,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonCheckbox,
    IonRow,
    IonAvatar,
    IonIcon,
    IonRouterLink,
    IonItemDivider,
    IonSplitPane,
    IonCard
} from '@ionic/react';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { DocumentReference, addDoc, arrayUnion, collection, doc, orderBy, startAt, endAt, getDoc, getDocs, query, serverTimestamp, updateDoc, where, FieldValue, setDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import Avatar from '../components/Avatar';
import './BulletinBoards.css';
import * as geofire from 'geofire-common';
import { useCurrentLocation } from '../components/CurrentLocationContext';
import { DocumentData } from '@firebase/firestore-types';
import { locationOutline, personCircleOutline } from 'ionicons/icons';
import { set } from 'date-fns';
import { get } from 'http';


interface UserDocument {
    username: string;
    avatarUrl: string;
}


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
    bulletinboardType: string;
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
    bulletinboardType: string;
    bulletinboard: DocumentReference | string;
    geoHash?: string;
    userLocationSentMessage?: UserLocation;
}


const BulletinBoards: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const [accountType, setAccountType] = useState<string>('');
    const [groupType, setGroupType] = useState<string>('');
    const [bulletinboardType, setBulletinboardType] = useState<string>('');
    const [combinedList, setCombinedList] = useState<SelectOption[]>([]);
    const [selectedBBOROrgValue, setselectedBBOROrgValue] = useState<string>('') || undefined;
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
    const [userLocation, setUserLocation] = useState<UserLocation | undefined>(undefined);
    const [bulletinBoardOrgMessagesArray, setBulletinBoardOrgMessagesArray] = useState<Message[]>([]);
    const [bulletinboardBikeBusMessagesArray, setBulletinBoardBikeBusMessagesArray] = useState<Message[]>([]);

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

        const communityOption = { value: "Community", label: "Community" };

        const fetchGroups = () => {
            Promise.all([fetchOrganizations(), fetchBikeBus()]).then(([orgs, bikebus]) => {
                setCombinedList([communityOption, ...orgs, ...bikebus]);
            });
        };

        if (geoConsent) {
            if (groupType === 'Community') {
                getLocation()
                Promise.all([fetchOrganizations(), fetchBikeBus(), handleCommunitySelection()]).then(([orgs, bikebus]) => {
                    setCombinedList([communityOption, ...orgs, ...bikebus]);
                });
            } else {
                fetchGroups();
            }
        } else {
            fetchGroups();
        }

        console.log('selectedBBOROrgValue:', selectedBBOROrgValue);

        console.log('Group Data:', groupData);

    }, [user, accountType, selectedBBOROrgValue, groupType, geoConsent, groupData]);

    const getLocation = () => {

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const userLocation = { lat: latitude, lng: longitude };
            setUserLocation(userLocation);
            setGeoConsent(true);
            // we want to automatically set the selectedBBOROrgValue to Community and then call the findCommunityMessagesWithinRadius function to display the messages for community
            setselectedBBOROrgValue("Community");
        }, (error) => {
            console.error("Error getting geolocation:", error);
            setGeoConsent(false);
        });
    };

    const handleCommunitySelection = async () => {
        return new Promise<Message[]>(async (resolve, reject) => {
            if (geoConsent === true) {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        const { latitude, longitude } = position.coords;
                        const userLocation = { lat: latitude, lng: longitude };

                        const communityMessagesRef = collection(db, 'messages');
                        const communityMessagesQuery = query(communityMessagesRef, where('bulletinboardType', '==', 'Community'));
                        const communityMessagesSnapshot = await getDocs(communityMessagesQuery);
                        const communityMessagesDataPromises = communityMessagesSnapshot.docs.map(async doc => {
                            const userDataRef = doc.data().user; // Get the user document reference
                            const userDoc = await getDoc(userDataRef); // Fetch the user document
                            const userData = userDoc.data() as UserDocument; // Cast to the expected shape

                            return {
                                ...doc.data(),
                                id: doc.id,
                                message: doc.data().message as string,
                                timestamp: doc.data().timestamp as FieldValue,
                                user: {
                                    id: userDoc.id, // Include the document ID as the user ID
                                    username: userData.username, // Extract the username
                                    avatarUrl: userData.avatarUrl, // Include the avatar URL if it's needed
                                },
                                bulletinboard: doc.data().bulletinboard || "Community",
                                bulletinboardType: doc.data().bulletinboardType || "Community",
                                geoHash: doc.data().geoHash as string,
                                userLocationSentMessage: doc.data().userLocationSentMessage as UserLocation,
                            };
                        });

                        const communityMessagesData = await Promise.all(communityMessagesDataPromises);


                        // Find community boards from the communityMessagesData that are within 25-mile radius
                        const communityMessages = communityMessagesData.filter((message) => {
                            const messageLocation = message.userLocationSentMessage as UserLocation;
                            const distanceInKm = geofire.distanceBetween([messageLocation.lat, messageLocation.lng], [userLocation.lat, userLocation.lng]);
                            const distanceInM = distanceInKm * 1000;
                            const radiusInM = 25 * 1609.34; // Convert miles to meters if radius is in miles
                            return distanceInM <= radiusInM;
                        });
                        console.log('Community Messages:', communityMessages);
                        //const communityMessages = await findCommunityMessagesWithinRadius(userLocation, 25);

                        // Transform communityMessages to match Message[] type
                        const transformedMessages = communityMessagesData.map((doc) => ({
                            message: doc.message,
                            user: doc.user,
                            timestamp: doc.timestamp,
                            bulletinboard: doc.bulletinboard,
                            bulletinboardType: doc.bulletinboardType,
                            geoHash: doc.geoHash,
                            userLocationSentMessage: doc.userLocationSentMessage,
                        }));

                        // Update the messagesData state with the transformed community messages
                        resolve(transformedMessages);
                        setMessagesData(transformedMessages);
                    });
                }
            }
        });
    };

    useEffect(() => {

        if (selectedBBOROrgValue) {
            if (selectedBBOROrgValue === 'Community') {
                // Handle community messages
                getLocation()
                handleCommunitySelection();
                return;
            } else {

                // first let's determine what kind of group it is - organization or bikebus. This can be determined by the bulletinboardType property on the bulletinboard document
                selectedBBOROrgValue && console.log('Selected BB or Org Value:', selectedBBOROrgValue);
                // selectedBBOROrgValue is actually the id of the bikebusgroup or organization and either one of those contains a bulletinboard document reference

                const bikebusgroupRef = doc(db, 'bikebusgroups', selectedBBOROrgValue);
                getDoc(bikebusgroupRef).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const bikebusgroupData = docSnapshot.data();
                        if (bikebusgroupData) {
                            setGroupData(bikebusgroupData);
                            const bulletinboard = bikebusgroupData.bulletinboard;
                            console.log('Bulletinboard:', bulletinboard);
                            if (bulletinboard) {
                                const bulletinboardRef: DocumentReference = bulletinboard;
                                getDoc(bulletinboardRef).then((docSnapshot) => {
                                    if (docSnapshot.exists()) {
                                        const bulletinboardData = docSnapshot.data();

                                        if (bulletinboardData) {
                                            const fetchBikeBus = async () => {
                                                const bulletinboardBikeBusMessages = bulletinboardData.Messages;
                                                const bulletinboardBikeBusMessagesPromises = bulletinboardBikeBusMessages.map(async (docRef: DocumentReference) => {
                                                    const docSnapshot = await getDoc(docRef);
                                                    const docData = docSnapshot.data() as Message;
                                                    const userUID = docData?.user?.id || docData?.user;

                                                    return {
                                                        message: docData?.message,
                                                        user: {
                                                            id: userUID,
                                                            // ... other user properties if needed
                                                        },
                                                        timestamp: docData?.timestamp,
                                                        bulletinboard: docData?.bulletinboard,
                                                        bulletinboardType: docData?.bulletinboardType,
                                                    };
                                                });
                                                console.log('bulletinboardBikeBusMessagesPromises:', bulletinboardBikeBusMessagesPromises);
                                                const bulletinboardBikeBusMessagesData = await Promise.all(bulletinboardBikeBusMessagesPromises);
                                                setMessagesData(bulletinboardBikeBusMessagesData);
                                            };
                                            fetchBikeBus();
                                        }
                                    }
                                });
                            }
                        }
                    }
                });

                // if the bikebusgroupRef does not exist, then we know it is an organization, and we can get the bulletinboard document reference from the organization document

                const organizationRef = doc(db, 'organizations', selectedBBOROrgValue);
                getDoc(organizationRef).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const organizationData = docSnapshot.data();
                        if (organizationData) {
                            setGroupData(organizationData);
                            const bulletinboard = organizationData.bulletinboard;
                            if (bulletinboard) {
                                const bulletinboardRef: DocumentReference = bulletinboard;
                                getDoc(bulletinboardRef).then((docSnapshot) => {
                                    if (docSnapshot.exists()) {
                                        const bulletinboardData = docSnapshot.data();

                                        if (bulletinboardData) {
                                            const fetchOrganizations = async () => {
                                                const bulletinboardOrgMessages = bulletinboardData.Messages;
                                                const bulletinboardOrgMessagesPromises = bulletinboardOrgMessages.map(async (docRef: DocumentReference) => {
                                                    const docSnapshot = await getDoc(docRef);
                                                    const docData = docSnapshot.data() as Message;
                                                    const userRef = docData?.user;

                                                    // Check if userRef is not null and has the correct structure
                                                    if (userRef && 'id' in userRef) {
                                                        // Handle case where userRef is an object with id, username, etc.
                                                        return {
                                                            message: docData?.message,
                                                            user: {
                                                                id: userRef.id,
                                                                username: userRef.username,
                                                                // ... other user properties
                                                            },
                                                            timestamp: docData?.timestamp,
                                                            bulletinboard: docData?.bulletinboard,
                                                            bulletinboardType: docData?.bulletinboardType,
                                                        };
                                                    } else if (userRef) {
                                                        // Handle case where userRef is a DocumentReference
                                                        const userDoc = await getDoc(userRef);
                                                        const userData = userDoc.data() as UserDocument;
                                                        const userUID = userDoc.id;

                                                        return {
                                                            message: docData?.message,
                                                            user: {
                                                                id: userUID,
                                                                username: userData?.username,
                                                                // ... other user properties
                                                            },
                                                            timestamp: docData?.timestamp,
                                                            bulletinboard: docData?.bulletinboard,
                                                            bulletinboardType: docData?.bulletinboardType,
                                                        };
                                                    }

                                                    // Handle other cases if needed
                                                    return null;
                                                });
                                                const bulletinboardOrgMessagesData = await Promise.all(bulletinboardOrgMessagesPromises);
                                                setMessagesData(bulletinboardOrgMessagesData.filter(message => message !== null));
                                            };
                                            fetchOrganizations();
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
            }
        }

    }, [selectedBBOROrgValue]);

    const getAvatarElement = (userId: string | undefined) => {
        // You can replace this with the logic to get the avatar URL for the given user ID
        const avatarUrl = user?.uid

        return avatarUrl ? (
            <IonAvatar>
                <Avatar uid={userId} />
            </IonAvatar>
        ) : (
            <IonIcon icon={personCircleOutline} />
        );
    };

    const currentUserAvatarElement = useMemo(() => getAvatarElement(user?.uid), [user]);

    const fetchOrganizations = useCallback(async () => {
        let formattedData: { value: string, label: string }[] = [];
        try {
            const uid = user?.uid;

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

    const submitMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Message Input:', messageInput);
        console.log('selectedBBOROrgValue:', selectedBBOROrgValue);

        // first check to see what selectedBBOROrgValue is set to. If it is set to Community, then we need to post to the community board only
        // If it is set to an organization or bikebus, then we need to post to that board only
        // If it is set to nothing, then we need to post to the community board only

        // whenever a user posts a message, we need to add it to the community board when the selects the checkbox next to the send button
        const postToCommunityBoard = async () => {
            // Get the user's current location
            try {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        const { latitude, longitude } = position.coords;
                        const userLocation = { lat: latitude, lng: longitude };

                        // Add the message to the messages document collection
                        const messageRef = await addDoc(collection(db, 'messages'), {
                            message: messageInput,
                            user: doc(db, 'users', `${user?.uid}`),
                            timestamp: serverTimestamp(),
                            // set the bulletinboard field to be the document reference for the community board, which is bulletinboard/{geohash}
                            bulletinboard: doc(db, 'bulletinboard', geofire.geohashForLocation([userLocation.lat, userLocation.lng])),
                            bulletinboardType: 'Community',
                            userLocationSentMessage: userLocation,
                            geoHash: geofire.geohashForLocation([userLocation.lat, userLocation.lng]),
                        });


                        // we're going to add this message to the community board in the document collection "bulletinboard"
                        // first we need to get the document reference for the community board
                        const communityBoardRef = doc(db, 'bulletinboard', geofire.geohashForLocation([userLocation.lat, userLocation.lng]));

                        // does it exist? if so updateDoc, if not, createDoc
                        const communityBoardDoc = await getDoc(communityBoardRef);
                        if (communityBoardDoc.exists()) {
                            await updateDoc(communityBoardRef, {
                                Messages: arrayUnion(messageRef),
                            });
                        }
                        else {
                            console.log('Community Board Doc Does Not Exist');
                            await setDoc(communityBoardRef, {
                                Messages: arrayUnion(messageRef),
                                geoHash: geofire.geohashForLocation([userLocation.lat, userLocation.lng]),
                                bulletinboardType: 'Community',
                            });
                        }
                        // fetchMessages with userLocation
                        // refresh the messages
                        // After adding the message, refresh and log the messages
                        const communityOption = { value: "Community", label: "Community" };
                        Promise.all([fetchBikeBus()]).then(([bikebus]) => {
                            setCombinedList([communityOption, ...bikebus]);
                            console.log('Messages after posting:', messagesData); // Log the messages data after posting
                        });
                        // refresh the combinedList on the page so that the messages refresh
                        // refresh the messages
                        // After adding the message, refresh and log the messages
                        handleCommunitySelection();
                    }

                    );
                }
            } catch (error) {
                console.log('Error posting to community board:', error);
            }

        };


        if (selectedBBOROrgValue === 'Community') {
            // Post to the community board only
            await postToCommunityBoard();
            setPostToCommunity(false); // Reset the community board selection
            // refresh the messages
            const communityOption = { value: "Community", label: "Community" };
            Promise.all([fetchBikeBus()]).then(([bikebus]) => {
                setCombinedList([communityOption, ...bikebus]);
            });
            setMessageInput('');
            return;
        }

        if (selectedBBOROrgValue !== 'Community') {

            if (messageInput.trim() === '' || !user || !avatarUrl) {
                return;
            }

            // does the selectedBBOrOrgValue exist in the bikebusgroups collection?
            getDoc(doc(db, 'bikebusgroups', selectedBBOROrgValue)).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const bikebusgroupData = docSnapshot.data();
                    if (bikebusgroupData) {
                        setGroupData(bikebusgroupData);
                        setGroupType('BikeBus');
                        setBulletinboardType('BikeBus');
                    }
                }
                else {
                    // if the selectedBBOrOrgValue does not exist in the bikebusgroups collection, then it must exist in the organizations collection
                    getDoc(doc(db, 'organizations', selectedBBOROrgValue)).then((docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const organizationData = docSnapshot.data();
                            if (organizationData) {
                                setGroupData(organizationData);
                                setGroupType('Organization');
                                setBulletinboardType('Organization');
                            }
                        }
                    });
                }
            });
            console.log('Group Data:', groupData);

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
        }
        // let's handle the case where the "post to community" checkbox is checked
        if (postToCommunity === true) {
            await postToCommunityBoard();
            setPostToCommunity(false); // Reset the community board selection
            // refresh the messages
            const communityOption = { value: "Community", label: "Community" };
            Promise.all([fetchBikeBus()]).then(([bikebus]) => {
                setCombinedList([communityOption, ...bikebus]);
            }
            );
        }
        setMessageInput('');
    };

    const sortedMessagesData = [...messagesData].sort((b, a) => {
        return Number(a.timestamp) - Number(b.timestamp);
    });

    const loadMoreData = (event: CustomEvent<void>) => {
        // Logic to load more chat messages

        // Get the last message in the list

        // Get the timestamp of the last message

        // Complete the infinite scroll loading (replace 'false' with a condition to disable further loading if necessary)
        event.target && (event.target as HTMLIonInfiniteScrollElement).complete();
    };

    return (
        <IonPage className="ion-flex-offset-app">
            <IonContent fullscreen>
                {anonAccess && (
                    <>
                        <IonCardTitle>Anonymous Access</IonCardTitle>
                        <IonButton
                            routerLink='/login'
                        >
                            Sign In
                        </IonButton>
                    </>
                )}
                <IonCardTitle>Bulletin Boards
                    {!geoConsent && !anonAccess && (
                        <IonButton color="success" className="share-location-button-chat"
                            onClick={() => {
                                getLocation();
                            }}
                        >
                            Share Location to Enable Community Boards
                            <IonIcon icon={locationOutline} slot="start" />
                        </IonButton>
                    )}
                </IonCardTitle>
                {!anonAccess && (
                    <>
                        <IonSelect
                            className="custom-ion-select"
                            value={selectedBBOROrgValue}
                            placeholder="Choose a Bulletin Board"
                            onIonChange={e => setselectedBBOROrgValue(e.detail.value)}
                        >
                            {combinedList.map((item, index) => (
                                <IonSelectOption key={index} value={item.value}>
                                    {item.label}
                                </IonSelectOption>
                            ))}
                        </IonSelect>
                        <form onSubmit={submitMessage} className="chat-input-form">
                            <IonInput
                                required={true}
                                aria-label='Message'
                                type='text'
                                value={messageInput}
                                placeholder="Enter your message"
                                onIonChange={e => setMessageInput(e.detail.value || '')}
                            />
                            {selectedBBOROrgValue !== 'Community' && (
                                <IonLabel>
                                    Cross-Post to Community Board?
                                    <IonCheckbox slot="start" checked={postToCommunity} onIonChange={e => setPostToCommunity(e.detail.checked)} />
                                </IonLabel>
                            )}
                            <IonRow className="chat-button-row">
                                <IonButton type="submit">Post Bulletin Board Message</IonButton>
                            </IonRow>
                        </form>
                        <IonInfiniteScroll threshold="80px" onIonInfinite={loadMoreData}>
                            <IonInfiniteScrollContent
                                loadingText="Loading more messages..."
                                loadingSpinner={null}>
                            </IonInfiniteScrollContent>
                            <IonList className="chat-list">
                                {sortedMessagesData.map((message, index) => {
                                    const isCurrentUserMessage = user?.uid === message?.user?.id;
                                    const avatarElement = isCurrentUserMessage
                                        ? currentUserAvatarElement
                                        : getAvatarElement(message?.user?.id);

                                    return (
                                        <IonItem lines="none" key={index}>
                                            {!isCurrentUserMessage && (
                                                <div slot="start" className="avatarChat">
                                                    {avatarElement}
                                                </div>
                                            )}
                                            <div className="chat-message-wrapper">
                                                <div className={`chat-message ${isCurrentUserMessage ? 'chat-item-right' : 'chat-item-left'}`}>
                                                    {message?.message}
                                                </div>
                                            </div>
                                            {isCurrentUserMessage && (
                                                <div slot="end" className="avatarChat">
                                                    {avatarElement}
                                                </div>
                                            )}
                                        </IonItem>
                                    );
                                })}
                            </IonList>
                        </IonInfiniteScroll>

                    </>
                )}
            </IonContent>
        </IonPage>
    );
};

export default BulletinBoards;
