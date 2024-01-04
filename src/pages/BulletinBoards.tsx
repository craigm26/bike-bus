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
    IonCardSubtitle,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCol,
    IonModal,
    IonCardHeader,
    IonCard,
    IonProgressBar,
    IonText,
    IonAlert,
    IonImg,
    IonThumbnail
} from '@ionic/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { DocumentReference, addDoc, arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, FieldValue, setDoc, deleteDoc, arrayRemove, onSnapshot } from 'firebase/firestore';
import useAuth from "../useAuth";
import Avatar from '../components/Avatar';
import './BulletinBoards.css';
import * as geofire from 'geofire-common';
import { add, closeCircleOutline, closeOutline, imageOutline, locationOutline, paperPlane, personCircleOutline, trashOutline, videocamOutline } from 'ionicons/icons';
import ChatListScroll from '../components/BulletinBoards/ChatListScroll';
import { db, storage } from '../firebaseConfig';
import { getDownloadURL, ref, uploadBytesResumable } from '@firebase/storage';


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
    const [selectedBBOROrgValue, setselectedBBOROrgValue] = useState<string>('OZrruuBJptp9wkAAVUt7');
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
    const supportedFileTypes = 'image/*,video/*';
    const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
    const [showContentModal, setShowContentModal] = useState(false);
    const [selectedContentType, setSelectedContentType] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const [showContentTypeAlert, setShowContentTypeAlert] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const addUserToGlobal = async (userId: string) => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            organizations: arrayUnion('Global')  // Assume organizations is an array field
        });
    };

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
                    if (userData) {
                        const isMemberOfGlobal = userData.organizations.includes('Global');
                        if (!isMemberOfGlobal) {
                            addUserToGlobal(user.uid);
                        }
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
            if (geoConsent) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    const userLocation = { lat: latitude, lng: longitude };

                    const communityMessagesRef = collection(db, 'messages');
                    const communityMessagesQuery = query(communityMessagesRef, where('bulletinboardType', '==', 'Community'));
                    const communityMessagesSnapshot = await getDocs(communityMessagesQuery);

                    const communityMessagesData = await Promise.all(
                        communityMessagesSnapshot.docs.map(async (docSnapshot) => {
                            const messageData = docSnapshot.data();
                            if (!messageData.user) {
                                console.warn('User reference is missing in message:', docSnapshot.id);
                                return null;
                            }
                            const userId = messageData.user.id;
                            const userDataRef = doc(db, 'users', userId);

                            const userDocSnapshot = await getDoc(userDataRef);
                            console.log('messageData.user:', messageData.user);
                            console.log('userDocSnapshot:', userDocSnapshot);
                            console.log('userDocSnapshot.exists():', userDocSnapshot.exists());

                            if (!userDocSnapshot.exists()) {
                                console.warn('User document does not exist for reference:', userDataRef.path);
                                return null;
                            }

                            const userData = userDocSnapshot.data() as UserDocument;
                            return {
                                id: docSnapshot.id,
                                message: messageData.message,
                                timestamp: messageData.timestamp,
                                bulletinboard: messageData.bulletinboard || "Community",
                                bulletinboardType: messageData.bulletinboardType || "Community",
                                geoHash: messageData.geoHash,
                                userLocationSentMessage: messageData.userLocationSentMessage,
                                user: {
                                    id: userDocSnapshot.id,
                                    username: userData.username,
                                    avatarUrl: userData.avatarUrl
                                }
                            } as Message; // Ensure the object conforms to the Message interface
                        })
                    );

                    // Filter out null and undefined values
                    const validCommunityMessages = communityMessagesData.filter((message) => message !== null) as Message[];

                    const communityMessagesWithinRadius = validCommunityMessages.filter(message => {
                        if (!message.userLocationSentMessage) return false; // Check if userLocationSentMessage is available

                        const messageLocation = message.userLocationSentMessage;
                        const distanceInKm = geofire.distanceBetween([messageLocation.lat, messageLocation.lng], [userLocation.lat, userLocation.lng]);
                        const distanceInMeters = distanceInKm * 1000;
                        const radiusInMeters = 25 * 1609.34; // 25 miles in meters
                        return distanceInMeters <= radiusInMeters;
                    });

                    resolve(communityMessagesWithinRadius);
                }, (error) => {
                    console.error("Error getting geolocation:", error);
                    reject(error);
                });
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

    }, [selectedBBOROrgValue, messageInput, selectedMessage]);

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

        const postToFirestore = async (messageData: any, bulletinBoardData: any) => {
            const messageRef = await addDoc(collection(db, 'messages'), messageData);
            await updateDoc(doc(db, bulletinBoardData.path), {
                Messages: arrayUnion(messageRef),
            });
        };

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

                        // After adding the message, refresh and log the messages
                        const communityOption = { value: "Community", label: "Community" };

                        Promise.all([fetchOrganizations(), fetchBikeBus(), handleCommunitySelection()]).then(([orgs, bikebus]) => {
                            setCombinedList([communityOption, ...orgs, ...bikebus]);
                        });
                        console.log('Messages after posting:', messagesData); // Log the messages data after posting
                    });
                    setIsFileUploaded(false);
                    setUploadedImageUrl(null);
                    setUploadedVideoUrl(null);
                    setMessageInput('');
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

    const handleAction = useCallback(async (action: string) => {
        console.log('Action:', action);

        if (!selectedMessage) {
            console.log("No selected message.");
            return;
        }

        console.log('Selected Message:', selectedMessage);

        let MessageId = selectedMessage.id;
        console.log('Initial Message ID:', MessageId);

        // Function to handle Edit Mode
        const handleEditMode = async (MessageId: string) => {
            const messageRef = doc(db, 'messages', MessageId);
            const docSnapshot = await getDoc(messageRef);
            if (docSnapshot.exists()) {
                const messageData = docSnapshot.data();
                if (messageData) {
                    setEditMode(true);
                    setEditMessage(messageData.message);
                }
            }
        };

        // Function to handle Message Deletion
        const handleDelete = async (MessageId: string, bulletinboardRef: any) => {
            const messageRef = doc(db, 'messages', MessageId);

            if (bulletinboardRef instanceof DocumentReference) {
                await updateDoc(bulletinboardRef, {
                    Messages: arrayRemove(messageRef),
                });
            }

            await deleteDoc(messageRef);

            console.log('Message successfully deleted!');
        };

        // Update the Message ID if required
        const messageRef = query(collection(db, 'messages'), where('message', '==', selectedMessage.message));
        const querySnapshot = await getDocs(messageRef);
        querySnapshot.forEach((doc) => {
            if (selectedMessage.message) {
                setSelectedMessage({
                    ...selectedMessage,
                    id: doc.id,
                    message: selectedMessage.message,
                });
                MessageId = doc.id;
            }
        });

        const bulletinboardRef = selectedMessage?.bulletinboard;
        console.log('Bulletinboard Ref:', bulletinboardRef);

        if (action === 'edit') {
            await handleEditMode(MessageId);
        } else if (action === 'delete') {
            await handleDelete(MessageId, bulletinboardRef);
        }

        // Close the action sheet
        setShowActionSheet(false);
        // refresh the chat-list
        const communityOption = { value: "Community", label: "Community" };
        Promise.all([fetchOrganizations(), fetchBikeBus(), handleCommunitySelection()]).then(([orgs, bikebus]) => {
            setCombinedList([communityOption, ...orgs, ...bikebus]);
        });


    }, [selectedMessage, handleCommunitySelection, fetchOrganizations, fetchBikeBus, editMode, editMessage, setEditMode, setEditMessage]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const storageRef = ref(storage, `chat_images/${selectedBBOROrgValue}/${user?.uid}/${Date.now()}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Update progress
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    // Handle errors
                    console.error('Error uploading image:', error);
                    setUploadError('Error uploading image.');
                    setUploadProgress(0); // Reset progress
                },
                () => {
                    // Handle successful upload
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        console.log('File available at', downloadURL);
                        setUploadedImageUrl(downloadURL);
                        setMessageInput(downloadURL);
                        setShowContentModal(false); // Close the modal
                    });
                }
            );
        }
    };

    // set max video size to 1gb
    const MAX_VIDEO_SIZE = 1000000000; // Maximum size in bytes
    const MAX_VIDEO_DURATION = 300; // Maximum duration in seconds
    
    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
    
            // Check file size
            if (file.size > MAX_VIDEO_SIZE) {
                alert("Video size should not exceed 10MB");
                return;
            }
    
            // Check video duration
            const video = document.createElement("video");
            video.preload = "metadata";
    
            video.onloadedmetadata = function() {
                window.URL.revokeObjectURL(video.src);
    
                const duration = video.duration;
                if (duration > MAX_VIDEO_DURATION) {
                    alert("Video duration should not exceed 30 seconds");
                    return;
                }
    
                // Continue with the upload process since the checks have passed
                const storageRef = ref(storage, `chat_videos/${selectedBBOROrgValue}/${user?.uid}/${Date.now()}`);
                const uploadTask = uploadBytesResumable(storageRef, file);
    
                uploadTask.on('state_changed',
                    (snapshot) => {
                        // Update progress
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (error) => {
                        // Handle errors
                        console.error('Error uploading video:', error);
                        setUploadError('Error uploading video.');
                        setUploadProgress(0); // Reset progress
                    },
                    () => {
                        // Handle successful upload
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                            console.log('File available at', downloadURL);
                            setUploadedVideoUrl(downloadURL);
                            setMessageInput(downloadURL);
                            setShowContentModal(false); // Close the modal
                        });
                    }
                );
            };
    
            video.src = URL.createObjectURL(file);
        }
    };
    



    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (user && user.uid && event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            if (file) {
                // Check if the file is an image or a video
                const isVideo = file.type.startsWith('video');
                // Set file upload state
                setIsFileUploaded(true);

                // Firebase Storage reference
                const fileExtension = file.name.split('.').pop();
                const storageRef = ref(storage, `chat_media/${selectedBBOROrgValue}/${user.uid}/${Date.now()}.${fileExtension}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                // Handle the upload process
                uploadTask.on(
                    'state_changed',
                    (snapshot: any) => {
                        // Handle upload progress
                        console.log('Upload progress:', (snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    },
                    (error: any) => {
                        // Handle upload error
                        console.error('Error uploading file:', error);
                    },
                    () => {
                        // Get download URL and update state
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                            console.log('File available at', downloadURL);
                            // Update state based on file type
                            if (isVideo) {
                                setUploadedVideoUrl(downloadURL);
                            } else {
                                setUploadedImageUrl(downloadURL);
                            }
                            setMessageInput(downloadURL);
                        });
                    },
                );
            }
        }
    };

    const handleContentTypeSelection = (type: 'photo' | 'video') => {
        setSelectedContentType(type);
        setShowContentTypeAlert(false);
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 0);
    };

    useEffect(() => {
        if (selectedBBOROrgValue === null) {
            setselectedBBOROrgValue('Global');
        }
    }, []);

    // save the below to implement the location consent for community boards later
    /*
    {!geoConsent && !anonAccess && (
                    <IonButton color="success" className="share-location-button-chat"
                        onClick={() => {
                            getLocation();
                        }}
                    >
                        Enable Community Boards
                        <IonIcon icon={locationOutline} slot="end" />
                    </IonButton>
                )}
    
                                {selectedBBOROrgValue !== 'Community' && selectedBBOROrgValue !== '' && (
                                    <IonLabel className="cross-post-label">
                                        Cross-Post to Community Board?
                                        <IonCheckbox slot="start" checked={postToCommunity} onIonChange={e => setPostToCommunity(e.detail.checked)} />
                                    </IonLabel>
                                )}

                */


    return (
        <IonPage className="ion-flex-offset-app">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Bulletin Boards</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {uploadProgress > 0 && uploadProgress < 100 && (
                    <IonProgressBar value={uploadProgress / 100}></IonProgressBar>
                )}
                {uploadError && (
                    <IonText color="danger">Upload failed: {uploadError}</IonText>
                )}
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
                {!anonAccess && (
                    <>
                        <IonRow>
                            <IonCol size="12" className="bulletin-board-selection-title">
                                <IonCardSubtitle className="bulletin-board-selection-title">
                                    <IonSelect
                                        className="custom-ion-select"
                                        value={selectedBBOROrgValue}
                                        placeholder="Global"
                                        onIonChange={e => setselectedBBOROrgValue(e.detail.value)}
                                    >
                                        {combinedList.map((item, index) => (
                                            <IonSelectOption key={index} value={item.value}>
                                                {item.label}
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                </IonCardSubtitle>
                            </IonCol>
                        </IonRow>
                        {selectedBBOROrgValue !== '' && (
                            <div className="chat-container">
                                <form onSubmit={submitMessage} className="chat-input-form">
                                    <IonRow>
                                        <IonCol size="1" className="icon-col">
                                            <div className="icon-container">
                                                <IonButton fill="solid" color="primary" aria-label="Show/hide" onClick={() => setShowContentTypeAlert(true)}>
                                                    <IonIcon icon={add} aria-hidden="true"></IonIcon>
                                                </IonButton>
                                                <input
                                                    type="file"
                                                    accept={selectedContentType === 'photo' ? 'image/*' : 'video/*'}
                                                    style={{ display: 'none' }}
                                                    onChange={selectedContentType === 'photo' ? handleImageUpload : handleVideoUpload}
                                                    ref={fileInputRef}
                                                />
                                            </div>
                                        </IonCol>
                                        <IonCol size="10" className="custom-chat-input-col">
                                            {uploadedImageUrl ? (
                                                <>
                                                <IonImg src={uploadedImageUrl} />
                                                <IonIcon icon={closeCircleOutline} onClick={() => { setUploadedImageUrl(null); setMessageInput(''); }} />
                                                </>
                                            ) : uploadedVideoUrl ? (
                                                <>
                                                <video width="480" height="240" src={uploadedVideoUrl} controls />
                                                <IonIcon icon={closeCircleOutline} onClick={() => { setUploadedVideoUrl(null); setMessageInput(''); }} />
                                                </>
                                            ) : (
                                                <IonInput
                                                    required={true}
                                                    aria-label='Message'
                                                    type='text'
                                                    min='2'
                                                    max='1000'
                                                    maxlength={500}
                                                    value={messageInput}
                                                    placeholder="Enter your message"
                                                    onIonChange={(e: CustomEvent) => setMessageInput(e.detail.value?.toString() || '')}
                                                    className="custom-chat-input"
                                                />
                                            )}
                                        </IonCol>
                                        <IonCol size="1" className="icon-col">
                                            <div className="icon-container">
                                                <IonButton type="button" onClick={submitMessage} disabled={isLoading}>
                                                    <IonIcon icon={paperPlane} />
                                                </IonButton>
                                            </div>
                                        </IonCol>
                                    </IonRow>
                                    <IonRow className="chat-button-row">
                                        {isLoading && <IonSpinner name="crescent" />}
                                    </IonRow>

                                    <IonAlert
                                        isOpen={showContentTypeAlert}
                                        onDidDismiss={() => setShowContentTypeAlert(false)}
                                        header={'Select Content'}
                                        buttons={[
                                            {
                                                text: 'Photo',
                                                handler: () => handleContentTypeSelection('photo')
                                            },
                                            {
                                                text: 'Video',
                                                handler: () => handleContentTypeSelection('video')
                                            },
                                            {
                                                text: 'Cancel',
                                                role: 'cancel',
                                                handler: () => setShowContentTypeAlert(false)
                                            }
                                        ]}
                                    />
                                </form>

                                <IonList className="chat-list">
                                    {sortedMessagesData.length > 0 ? (
                                        sortedMessagesData.map((message, index) => {
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
                                                            selectedBBOROrgValue={'OZrruuBJptp9wkAAVUt7' || selectedBBOROrgValue}
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
                                        })
                                    )
                                        : (
                                            <IonCard className="chat-card-item">
                                                <IonCardHeader>
                                                    <IonLabel>There aren't any messages yet in this board, start it.</IonLabel>
                                                </IonCardHeader>
                                            </IonCard>
                                        )}
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
        </IonPage >
    );
};

export default BulletinBoards;
