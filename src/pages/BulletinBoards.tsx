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
    IonCheckbox,
    IonRow,
    IonAvatar,
    IonIcon,
    IonActionSheet,
    IonSpinner,
    IonChip
} from '@ionic/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { DocumentReference, addDoc, arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, FieldValue, setDoc, deleteDoc, arrayRemove, onSnapshot } from 'firebase/firestore';
import useAuth from "../useAuth";
import Avatar from '../components/Avatar';
import './BulletinBoards.css';
import * as geofire from 'geofire-common';
import { cameraOutline, closeOutline, locationOutline, personCircleOutline, trashOutline } from 'ionicons/icons';
import ChatListScroll from '../components/BulletinBoards/ChatListScroll';
import { db, storage } from '../firebaseConfig';
import { getDownloadURL, ref, uploadBytesResumable } from '@firebase/storage';
import { set } from 'date-fns';
import { is } from 'date-fns/locale';


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
    id: string;
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
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editMessage, setEditMessage] = useState('');
    const locationFetchedRef = useRef(false);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [isFileUploaded, setIsFileUploaded] = useState(false);




    useEffect(() => {
        setIsLoading(true);

        let unsubscribeUser: () => void;

        if (user) {
            const userRef = doc(db, 'users', user.uid);
            unsubscribeUser = onSnapshot(userRef, (docSnapshot) => {
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
                setCombinedList(geoConsent ? [communityOption, ...orgs, ...bikebus] : [...orgs, ...bikebus]);
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
        setIsLoading(false);

        return () => {
            // Unsubscribe on unmount
            unsubscribeUser?.();
        };

    }, [user, accountType, selectedBBOROrgValue, groupType, geoConsent, groupData]);

    const getLocation = (callback?: () => void) => {
        if (locationFetchedRef.current) return;


        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const userLocation = { lat: latitude, lng: longitude };
            setUserLocation(userLocation);
            setGeoConsent(true);
            // we want to automatically set the selectedBBOROrgValue to Community and then call the findCommunityMessagesWithinRadius function to display the messages for community
            setselectedBBOROrgValue("Community");
            locationFetchedRef.current = true;
            callback?.();
            await handleCommunitySelection();
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
                            console.log('User Data Ref:', userDataRef);
                            const userDoc = await getDoc(userDataRef); // Fetch the user document
                            console.log('User Doc:', userDoc);
                            if (!userDoc.exists()) {
                                console.warn('User document does not exist for reference:', userDataRef);
                            }


                            if (userDoc.exists()) {

                                const userData = userDoc.data() as UserDocument; // Cast to the expected shape
                                console.log('User Data:', userData);

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
                            } else {
                                console.warn('User document does not exist');
                            }
                        });

                        const communityMessagesData = await Promise.all(communityMessagesDataPromises);

                        // Filter out messages with valid 'message' and 'user' properties
                        const validCommunityMessagesData = communityMessagesData.filter(message => message !== undefined && message.message && message.user) as Message[];

                        // Find community boards from the validCommunityMessagesData that are within a 25-mile radius
                        const communityMessages = validCommunityMessagesData.filter(message => {
                            const messageLocation = message.userLocationSentMessage as UserLocation;
                            const distanceInKm = geofire.distanceBetween([messageLocation.lat, messageLocation.lng], [userLocation.lat, userLocation.lng]);
                            const distanceInM = distanceInKm * 1000;
                            const radiusInM = 25 * 1609.34; // Convert miles to meters if radius is in miles
                            return distanceInM <= radiusInM;
                        });

                        // Update the messagesData state with the community messages
                        resolve(communityMessages);
                        setMessagesData(communityMessages);

                    });
                }
            }
        });
    };

    const handleCommunitySelectionWithLocation = async () => {
        setIsLoading(true); // Set loading state
        await getLocation(); // Get the location
        await handleCommunitySelection(); // Handle community selection
        setIsLoading(false); // Reset loading state
    };


    useEffect(() => {
        setIsLoading(true);

        let unsubscribeBikebusgroup: () => void;
        let unsubscribeOrganization: () => void;

        if (selectedBBOROrgValue) {
            if (selectedBBOROrgValue === 'Community') {
                // Handle community messages
                handleCommunitySelectionWithLocation();
                return;
            } else {

                // first let's determine what kind of group it is - organization or bikebus. This can be determined by the bulletinboardType property on the bulletinboard document
                selectedBBOROrgValue && console.log('Selected BB or Org Value:', selectedBBOROrgValue);
                // selectedBBOROrgValue is actually the id of the bikebusgroup or organization and either one of those contains a bulletinboard document reference

                const bikebusgroupRef = doc(db, 'bikebusgroups', selectedBBOROrgValue);
                unsubscribeBikebusgroup = onSnapshot(bikebusgroupRef, (docSnapshot) => {
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
                unsubscribeOrganization = onSnapshot(organizationRef, (docSnapshot) => {
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
        setIsLoading(false);

        return () => {
            // Unsubscribe on unmount
            unsubscribeBikebusgroup?.();
            unsubscribeOrganization?.();
        };

    }, [selectedBBOROrgValue, messageInput]);

    const getAvatarElement = (userId: string | undefined) => {
        // You can replace this with the logic to get the avatar URL for the given user ID
        const avatarUrl = user?.uid

        return avatarUrl ? (
            <IonAvatar>
                <Avatar uid={userId} size={"small"}></Avatar>
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
        if (isFileUploaded) {
            setMessageInput(uploadedImageUrl || '');
        }

        if (!messageInput.trim()) {
            console.error('Message input is empty or whitespace only');
            return;
        }
        console.log('Message Input:', messageInput);
        console.log('selectedBBOROrgValue:', selectedBBOROrgValue);

        // first check to see what selectedBBOROrgValue is set to. If it is set to Community, then we need to post to the community board only
        // If it is set to an organization or bikebus, then we need to post to that board only
        // If it is set to nothing, then we need to post to the community board only

        // whenever a user posts a message, we need to add it to the community board when they select the checkbox next to the send button
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
                            type: isFileUploaded ? 'file' : 'text',
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

                        Promise.all([fetchOrganizations(), fetchBikeBus(), handleCommunitySelection()]).then(([orgs, bikebus]) => {
                            setCombinedList([communityOption, ...orgs, ...bikebus]);
                        });
                        console.log('Messages after posting:', messagesData); // Log the messages data after posting
                    });
                    setIsFileUploaded(false);
                    setUploadedImageUrl(null);
                    setMessageInput('');
                    // refresh the combinedList on the page so that the messages refresh
                    // refresh the messages
                    // After adding the message, refresh and log the messages
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
            Promise.all([fetchOrganizations(), fetchBikeBus(), handleCommunitySelection()]).then(([orgs, bikebus]) => {
                setCombinedList([communityOption, ...orgs, ...bikebus]);
            });
            handleCommunitySelection();
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
            Promise.all([fetchOrganizations(), fetchBikeBus(), handleCommunitySelection()]).then(([orgs, bikebus]) => {
                setCombinedList([communityOption, ...orgs, ...bikebus]);
            });
        }
        setMessageInput('');
    };

    const sortedMessagesData = [...messagesData].sort((b, a) => {
        return Number(a.timestamp) - Number(b.timestamp);
    });

    const handleSelectedMessage = useCallback((message: Message) => {
        setSelectedMessage(message);
        setShowActionSheet(true);
    }, []);

    const handleAction = useCallback((action: string) => {

        console.log('Action:', action);
        console.log('Selected Message:', selectedMessage);



        // get the message ID from the selectedMessage state
        if (!selectedMessage) return;

        if (selectedMessage) {
            // we have the selectedMessage as a firestore document object in the messages document collection, now let's query for the document and get the id of the document
            const messageRef = query(collection(db, 'messages'), where('message', '==', selectedMessage.message));
            getDocs(messageRef).then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    console.log('Message ID:', doc.id);
                    setSelectedMessage({
                        ...selectedMessage,
                        id: doc.id,
                    });
                });
            });

            const MessageId = selectedMessage?.id;
            console.log('Message ID:', MessageId);

            // get the message document reference
            // get the bulletinboard document reference
            const bulletinboardRef = selectedMessage?.bulletinboard;
            console.log('Bulletinboard Ref:', bulletinboardRef);

            if (action === 'edit') {

                // allow the user to edit the message with their new message
                // Then we can use the message document reference to update the message
                // Then we can use the message document reference to update the message in the bulletin board document

                // first we need to get the message from the message document reference
                const messageRef = doc(db, 'messages', MessageId);
                getDoc(messageRef).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const messageData = docSnapshot.data();
                        if (messageData) {
                            setEditMode(true);
                            setEditMessage(messageData.message);
                        }
                    }
                });

            } else if (action === 'delete') {
                console.log('Delete Message');
                console.log('Message ID:', MessageId);

                const messageRef = doc(db, 'messages', MessageId);

                // delete the message document reference in the bulletinboard document
                if (bulletinboardRef instanceof DocumentReference) {
                    updateDoc(bulletinboardRef, {
                        Messages: arrayRemove(messageRef),
                    });
                } else {
                    console.error('bulletinboardRef is not a DocumentReference:', bulletinboardRef);
                }

                // delete the message document
                deleteDoc(messageRef).then(() => { // Use messageRef instead of selectedMessage
                    console.log('Message successfully deleted!');
                }).catch((error) => {
                    console.error('Error removing message:', error);
                });
            }
            // refresh the messages
            const communityOption = { value: "Community", label: "Community" };
            Promise.all([fetchOrganizations(), fetchBikeBus(), handleCommunitySelection()]).then(([orgs, bikebus]) => {
                setCombinedList([communityOption, ...orgs, ...bikebus]);
            });
        }

        // Close the action sheet
        setShowActionSheet(false);
    }, [selectedMessage, handleCommunitySelection, fetchOrganizations, fetchBikeBus, editMode, editMessage, setEditMode, setEditMessage]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (user && user.uid && event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            if (file) {
                setIsFileUploaded(true);
                const storageRef = ref(storage, `chat_images/${selectedBBOROrgValue}/${user.uid}/${Date.now()}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on(
                    'state_changed',
                    (snapshot: any) => {
                        console.log('Upload progress:', (snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    },
                    (error: any) => {
                        console.error('Error uploading image:', error);
                    },
                    () => {
                        // TODO: Update your chat message state with the new image URL here
                        // For instance, you might push this new message into your `sortedMessagesData` array
                        // You might also want to update the `messagesData` state to include the new message
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                            console.log('File available at', downloadURL);
                            setUploadedImageUrl(downloadURL); // Set the state variable with the URL
                            // TODO: Update your chat message state with the new image URL here
                            setMessageInput(downloadURL);
                        });
                        // when we submit the message, we need to check to see if the messageInput is a URL. If it is, then we need to display the image in the chat
                        // we can do this by checking to see if the messageInput starts with "https://firebasestorage.googleapis.com"
                        // if it does, then we need to display the image in the chat
                        // if it does not, then we need to display the message in the chat or the other options for URLs
                        // we can do this by checking to see if the messageInput starts with "http://", "https://", "www.", or "ftp://"
                        // push image to the messagesData array
                        // push image to the sortedMessagesData array
                        // push image to the bulletinboard document
                        // push image to the bulletinboard document in the community board

                    },
                );
            }
        }
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
                        {selectedBBOROrgValue !== '' && (
                            <div className="chat-container">
                                <form onSubmit={submitMessage} className="chat-input-form">
                                    <IonChip>
                                        <IonInput
                                            required={true}
                                            aria-label='Message'
                                            type='text'
                                            value={messageInput}
                                            placeholder="Enter your message"
                                            onIonChange={e => setMessageInput(e.detail.value || '')}
                                        />
                                        <label htmlFor="upload-button">
                                            <IonIcon icon={cameraOutline} />
                                        </label>
                                        {uploadedImageUrl && <img src={uploadedImageUrl} alt="Uploaded preview" />}
                                        <input id="upload-button" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                    </IonChip>
                                    <IonRow>
                                        {selectedBBOROrgValue !== 'Community' && selectedBBOROrgValue !== '' && (
                                            <IonLabel>
                                                Cross-Post to Community Board?
                                                <IonCheckbox slot="start" checked={postToCommunity} onIonChange={e => setPostToCommunity(e.detail.checked)} />
                                            </IonLabel>
                                        )}
                                    </IonRow>
                                    <IonRow className="chat-button-row">
                                        <IonButton type="submit" disabled={isLoading}>
                                            Post Bulletin Board Message
                                        </IonButton>
                                        {isLoading && <IonSpinner name="crescent" />}
                                    </IonRow>
                                </form>
                                <IonList className="chat-list">
                                    {sortedMessagesData.map((message, index) => {
                                        const isCurrentUserMessage = user?.uid === message?.user?.id;
                                        const avatarElement = isCurrentUserMessage
                                            ? currentUserAvatarElement
                                            : getAvatarElement(message?.user?.id);

                                        return (
                                            <div className="chat-item" key={index}>
                                                <ChatListScroll
                                                    key={index}
                                                    avatarElement={avatarElement}
                                                    user={user}
                                                    selectedBBOROrgValue={selectedBBOROrgValue}
                                                    combinedList={combinedList}
                                                    groupData={groupData}
                                                    sortedMessagesData={sortedMessagesData}
                                                    isCurrentUserMessage={isCurrentUserMessage}
                                                    selectedMessage={null}
                                                    isLoading={isLoading}
                                                    onMessageSelected={handleSelectedMessage}
                                                    setShowActionSheet={setShowActionSheet}
                                                    handleAction={handleAction}
                                                />
                                            </div>
                                        );
                                    })}
                                </IonList>
                            </div>
                        )}
                    </>
                )}
                <IonActionSheet
                    isOpen={showActionSheet}
                    onDidDismiss={() => setShowActionSheet(false)}
                    buttons={[
                        {
                            text: 'Delete',
                            role: 'destructive',
                            icon: trashOutline,
                            handler: () => handleAction('delete'),
                        },
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            icon: closeOutline,
                            handler: () => setShowActionSheet(false),
                        },
                    ]}
                />
            </IonContent>
        </IonPage>
    );
};

export default BulletinBoards;
