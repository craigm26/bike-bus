export interface UserDocument {
    id: string;
    username: string;
    avatarUrl: string;
}

export interface Coordinate {
    lat: number;
    lng: number;
}

export interface FirestoreRef {
    path: string;
}

export interface BikeBus {
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

export interface Organization {
    id: string;
    NameOfOrg: string;
    accountType: string;
    groupType: string;
    description: string;
    OrganizationCreator: string;
    bulletinboard: FirestoreRef;
}

export interface UserLocation {
    lat: number;
    lng: number;
}

// Firebase's FieldValue type for timestamps
import { FieldValue } from 'firebase/firestore'; 

export interface Message {
    message: string;
    user: UserDocument | null;
    BikeBusGroup?: FirestoreRef | null;
    Organization?: FirestoreRef | null;
    timestamp: FieldValue;
    bulletinboardType: string;
    bulletinboard: FirestoreRef | string;
    geoHash?: string;
    userLocationSentMessage?: UserLocation;
    id: string;
}
