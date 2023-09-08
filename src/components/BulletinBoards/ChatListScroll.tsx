import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { IonAvatar, IonContent, IonIcon, IonItem, IonLabel, IonPage, IonRefresher, IonRefresherContent, RefresherEventDetail } from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import useAuth from "../../useAuth";
import { useAvatar } from "../useAvatar";
import Avatar from "../Avatar";
import { DocumentReference, FieldValue, arrayRemove, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import * as geofire from 'geofire-common';
import { useCurrentLocation } from '../CurrentLocationContext';
import { type } from 'os';

type ChatListScrollProps = {
    avatarElement: JSX.Element;
    isCurrentUserMessage: boolean;
    selectedMessage: Message | null;
    user: any;
    sortedMessagesData: any[];
    selectedBBOROrgValue: string | null;
    combinedList: { value: string, label: string }[];
    groupData: any | undefined;
    isLoading: boolean;
    onMessageSelected: (message: Message) => void;
    setShowActionSheet: (value: boolean) => void;
    handleAction: (action: string) => void;
};




interface UserLocation {
    lat: number;
    lng: number;
}

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

interface Organization {
    id: string;
    NameOfOrg: string;
    accountType: string;
    groupType: string;
    description: string;
    OrganizationCreator: string;
    bulletinboard: FirestoreRef;
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

const ChatListScroll: React.FC<ChatListScrollProps> = ({
    avatarElement,
    isCurrentUserMessage,
    selectedMessage,
    user,
    onMessageSelected,
    setShowActionSheet,
    sortedMessagesData,
    selectedBBOROrgValue,
    combinedList,
    groupData,
    isLoading
}) => {


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

    const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
        console.log('Refreshing data');
        // Simulate a trip to the server that takes 1 seconds
        setTimeout(() => {
            event.detail.complete();
        }, 1000);

    };

    return (
        <IonPage>
            <IonContent scrollY={false}>
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>
                <Virtuoso className="ion-content-scroll-host"
                    style={{ height: '100%' }}
                    totalCount={sortedMessagesData.length}
                    itemContent={(index) => {
                        const message = sortedMessagesData[index];
                        const isCurrentUserMessage = user?.uid === message?.user?.id;
                        const avatarElement = isCurrentUserMessage
                            ? currentUserAvatarElement
                            : getAvatarElement(message?.user?.id);

                        const isImageURL = (url: any) => {
                            return url.match(/^https:\/\/firebasestorage.googleapis.com\/v0\/b\/bikebus-71dd5.appspot.com\/o\/chat_images/) != null;
                        };

                        console.log(isImageURL(message?.message));

                        return (
                            <div className={`chat-message-wrapper ${isCurrentUserMessage ? 'chat-item-right' : 'chat-item-left'}`}>
                                {!isCurrentUserMessage && (
                                    <div className="avatarChat">{avatarElement}</div>
                                )}
                                <IonItem className="ion-items-messages" lines="none">
                                    <div className="chat-message"
                                        onClick={() => {
                                            if (isCurrentUserMessage) {
                                                onMessageSelected(message);
                                                setShowActionSheet(true);
                                            }
                                        }}
                                    >
                                        {isImageURL(message?.message) ? (
                                            <img src={message?.message} alt="chat image" style={{ maxWidth: "100%", maxHeight: "200px" }} />
                                        ) : (
                                            message?.message
                                        )}
                                    </div>
                                    {isCurrentUserMessage && (
                                        <div className="avatarChat">{avatarElement}</div>
                                    )}
                                </IonItem>
                            </div>
                        );
                    }}

                />

            </IonContent>
        </IonPage>
    );

};


export default ChatListScroll;
