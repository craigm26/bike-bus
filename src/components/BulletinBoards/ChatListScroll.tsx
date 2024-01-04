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

    const virtuoso = useRef(null);

    const handleMediaLoad = () => {
        virtuoso.current && (virtuoso.current as any).adjustForPrependedItems(0);
    };


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
                        console.log(`Rendering message at index ${index}: `, message);
                        const isCurrentUserMessage = user?.uid === message?.user?.id;
                        const avatarElement = isCurrentUserMessage
                            ? currentUserAvatarElement
                            : getAvatarElement(message?.user?.id);

                        const isImageURL = (url: any) => {
                            return url.match(/^https:\/\/firebasestorage.googleapis.com\/v0\/b\/bikebus-71dd5.appspot.com\/o\/chat_images/) != null;
                        };

                        const isVideoURL = (url: any) => {
                            return url.match(/^https:\/\/firebasestorage.googleapis.com\/v0\/b\/bikebus-71dd5.appspot.com\/o\/chat_videos/) != null;
                        };

                        const handleMediaLoad = () => {
                            virtuoso.current && (virtuoso.current as any).adjustForPrependedItems(0);
                        };

                        const isYouTubeURL = (url: string) => {
                            return url.match(/(youtube\.com\/watch\?v=|youtu\.be\/)/) !== null;
                        };
                        
                        const renderMessageContent = (messageContent: string) => {
                            if (isImageURL(messageContent)) {
                                return <img src={messageContent} onLoad={handleMediaLoad} alt="chat image" style={{ maxWidth: "100%" }} />;
                            } else if (isVideoURL(messageContent)) {
                                return <video src={messageContent} onLoad={handleMediaLoad} controls style={{ maxWidth: "100%" }} />;
                            } else if (isYouTubeURL(messageContent)) {
                                const videoIdMatch = messageContent.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
                                const videoId = videoIdMatch ? videoIdMatch[1] : null;
                                if (videoId) {
                                    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                    return <iframe src={embedUrl} title="YouTube video" frameBorder="0" allowFullScreen style={{ maxWidth: "100%" }} />;
                                } else {
                                    // If video ID could not be extracted, return a placeholder or error message
                                    return <div>Video could not be loaded.</div>;
                                }
                            } else {
                                return <span>{messageContent}</span>;
                            }
                        };
                        

                        return (
                            <IonPage>
                                <IonContent scrollY={false}>
                                    <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                                        <IonRefresherContent></IonRefresherContent>
                                    </IonRefresher>
                                    <Virtuoso className="ion-content-scroll-host"
                                        ref={virtuoso}
                                        style={{ height: '100%' }}
                                        totalCount={sortedMessagesData.length}
                                        itemContent={(index) => {
                                            const message = sortedMessagesData[index];
                                            const isCurrentUserMessage = user?.uid === message?.user?.id;
                                            const avatarElement = isCurrentUserMessage
                                                ? currentUserAvatarElement
                                                : getAvatarElement(message?.user?.id);

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
                                                            {renderMessageContent(message?.message)}
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
                    }}

                />

            </IonContent>
        </IonPage>
    );

};


export default ChatListScroll;
