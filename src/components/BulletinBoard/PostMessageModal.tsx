import { IonFab, IonFabButton, IonIcon, IonModal, IonCardTitle, IonButton, IonCheckbox, IonContent, IonInput, IonLabel, IonPage, IonRow, IonSelect, IonSelectOption } from "@ionic/react";
import { doc, getDoc, DocumentReference, addDoc, arrayUnion, collection, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { chatbubblesOutline } from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import useAuth from "../../useAuth";
import { useAvatar } from "../useAvatar";
import { FieldValue } from 'firebase/firestore';
import * as geofire from 'geofire-common';
import { DocumentData } from '@firebase/firestore-types';
import { locationOutline, personCircleOutline } from 'ionicons/icons';
import { set } from 'date-fns';
import { get } from 'http';
import { useCurrentLocation } from "../CurrentLocationContext";


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

interface PostMessageModalProps {
    isOpen: boolean;
    toggleModal: () => void;
  }


const PostMessageModal: React.FC<PostMessageModalProps> = ({ isOpen, toggleModal }) => {


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
    const [showModal, setShowModal] = useState(false);


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

        console.log('useEffect was called');
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

        if (selectedBBOROrgValue) {
            if (selectedBBOROrgValue === 'Community') {
                // Handle community messages
                getLocation()
                console.log('Community Selected');
                console.log('Selected Value:', selectedBBOROrgValue);
                handleCommunitySelection();
                console.log('handleCommunitySelection was called');
            } else {

                // first let's determine what kind of group it is - organization or bikebus. This can be determined by the bulletinboardType property on the bulletinboard document
                selectedBBOROrgValue && console.log('Selected BB or Org Value:', selectedBBOROrgValue);
                // selectedBBOROrgValue is actually the id of the bikebusgroup or organization and either one of those contains a bulletinboard document reference

                const bikebusgroupRef = doc(db, 'bikebusgroups', selectedBBOROrgValue);
                console.log('bikebusgroupRef:', bikebusgroupRef);
                getDoc(bikebusgroupRef).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const bikebusgroupData = docSnapshot.data();
                        console.log('bikebusgroupData:', bikebusgroupData);
                        if (bikebusgroupData) {
                            const bulletinboard = bikebusgroupData.bulletinboard;
                            console.log('bulletinboard:', bulletinboard);
                            if (bulletinboard) {
                                const bulletinboardRef: DocumentReference = bulletinboard;
                                console.log('bulletinboardRef:', bulletinboardRef);
                                getDoc(bulletinboardRef).then((docSnapshot) => {
                                    if (docSnapshot.exists()) {
                                        const bulletinboardData = docSnapshot.data();
                                        console.log('bulletinboardData:', bulletinboardData);

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
                console.log('organizationRef:', organizationRef);
                getDoc(organizationRef).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const organizationData = docSnapshot.data();
                        console.log('organizationData:', organizationData);
                        if (organizationData) {
                            const bulletinboard = organizationData.bulletinboard;
                            console.log('bulletinboard:', bulletinboard);
                            if (bulletinboard) {
                                const bulletinboardRef: DocumentReference = bulletinboard;
                                console.log('bulletinboardRef:', bulletinboardRef);
                                getDoc(bulletinboardRef).then((docSnapshot) => {
                                    if (docSnapshot.exists()) {
                                        const bulletinboardData = docSnapshot.data();
                                        console.log('bulletinboardData:', bulletinboardData);

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
        console.log('selectedBBOROrgValue:', selectedBBOROrgValue);
        console.log('groupData:', groupData);
        console.log('messagesData:', messagesData);

    }, [user, accountType, selectedBBOROrgValue, groupType, geoConsent, groupData]);



    const getLocation = () => {
        console.log('getLocation was called')

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
        console.log('getBulletinBoardInfoFromDocRef was called')
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
        console.log('submitMessage was called')

        // first check to see what selectedBBOROrgValue is set to. If it is set to Community, then we need to post to the community board only
        // If it is set to an organization or bikebus, then we need to post to that board only
        // If it is set to nothing, then we need to post to the community board only

        console.log('Selected Value:', selectedBBOROrgValue);
        console.log('Message Input:', messageInput);

        if (selectedBBOROrgValue === 'Community') {
            // Post to the community board only
            await postToCommunityBoard();
            setMessageInput('');
            setPostToCommunity(false); // Reset the community board selection
            // refresh the messages
            const communityOption = { value: "Community", label: "Community" };
            Promise.all([fetchBikeBus()]).then(([bikebus]) => {
                setCombinedList([communityOption, ...bikebus]);
            });
            return;
        }

        if (selectedBBOROrgValue !== 'Community' && selectedBBOROrgValue !== '') {

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
        }
    };

    // whenever a user posts a message, we need to add it to the community board when the selects the checkbox next to the send button
    const postToCommunityBoard = async () => {
        console.log('postToCommunityBoard was called')
        // Get the user's current location
        console.log('Message Input before posting:', messageInput); // Log the message input
        console.log(messageInput)
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
                    // set the bulletinboard field to be the document reference for the community board, which is bulletinboard/{geohash}
                    bulletinboard: doc(db, 'bulletinboard', geofire.geohashForLocation([userLocation.lat, userLocation.lng])),
                    bulletinboardType: 'Community',
                    userLocationSentMessage: userLocation,
                    geoHash: geofire.geohashForLocation([userLocation.lat, userLocation.lng]),
                });
                console.log(messageRef)
                console.log('Message...', messageRef);

                // we're going to add this message to the community board in the document collection "bulletinboard"
                // first we need to get the document reference for the community board
                const communityBoardRef = doc(db, 'bulletinboard', geofire.geohashForLocation([userLocation.lat, userLocation.lng]));
                console.log('Community Board Ref:', communityBoardRef);
                // does it exist? if so updateDoc, if not, createDoc
                const communityBoardDoc = await getDoc(communityBoardRef);
                console.log('Community Board Doc:', communityBoardDoc);
                if (communityBoardDoc.exists()) {
                    console.log('Community Board Doc Exists');
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
    };


    const openModal = () => {
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };


    return (
        < IonPage className="ion-flex-offset-app" >
            <IonContent fullscreen>
                <div className='map-button-container footer-content'>
                    <IonFab vertical="bottom" horizontal="end" slot="fixed">
                        <IonFabButton onClick={openModal}>
                            <IonIcon color="#ffd800" icon={chatbubblesOutline} />
                        </IonFabButton>
                    </IonFab>
                    <IonModal isOpen={showModal} onDidDismiss={closeModal}>
                        <IonCardTitle>Bulletin Boards</IonCardTitle>
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
                                        value={messageInput}
                                        placeholder="Enter your message"
                                        onIonChange={e => setMessageInput(e.detail.value || '')}
                                    />
                                    {selectedBBOROrgValue !== 'Community' && (
                                        <IonLabel>
                                            Post to Community Board?
                                            <IonCheckbox slot="start" checked={postToCommunity} onIonChange={e => setPostToCommunity(e.detail.checked)} />
                                        </IonLabel>
                                    )}
                                    <IonRow className="chat-button-row">
                                        <IonButton type="submit">Post Bulletin Board Message</IonButton>
                                    </IonRow>
                                </form>
                            </>
                        )}
                    </IonModal>

                </div>
            </IonContent>
        </IonPage >
    );
};

export default PostMessageModal;
