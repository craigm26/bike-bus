import React, { useEffect, useState } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/react';
import { getDoc } from 'firebase/firestore';
import UseRoutes from './useRoutes';

interface GroupData {
    BikeBusLeaders: any[]; // Replace with actual type if known
    BikeBusMembers: any[]; // Replace with actual type if known
    BikeBusName: string;
    GroupMessages: any[]; // Replace with actual type if known
    bikebusstations: any[]; // Replace with actual type if known
    routeId: string;
    schedule: Date[];
}

interface LeaderData {
    username: string;
}

interface MemberData {
    username: string;
}

const BikeBusGroup: React.FC<GroupData> = ({ BikeBusLeaders, BikeBusMembers, BikeBusName, GroupMessages, bikebusstations, routeId, schedule }) => {
    const [groupData, setGroupData] = useState<GroupData | null>(null);
    const [leaderNames, setLeaderNames] = useState<string[]>([]);
    const [memberNames, setMemberNames] = useState<string[]>([]);
    const { fetchedRoutes, loading, error } = UseRoutes({ routeId });

    useEffect(() => {
        setGroupData({
            BikeBusLeaders,
            BikeBusMembers,
            BikeBusName,
            GroupMessages,
            bikebusstations,
            routeId,
            schedule,
        });

        // Fetch leader names
        const fetchLeaderNames = async () => {
            const names = [];
            for (const leaderRef of BikeBusLeaders) {
                const leaderSnapshot = await getDoc(leaderRef);
                const leaderData = leaderSnapshot.data() as LeaderData; // cast to LeaderData
                if (leaderData && leaderData.username) {
                    names.push(leaderData.username);
                }
            }
            setLeaderNames(names);
        };

        fetchLeaderNames();

        const fetchMemberNames = async () => {
            const names = [];
            for (const memberRef of BikeBusMembers) {
                const memberSnapshot = await getDoc(memberRef);
                const memberData = memberSnapshot.data() as MemberData; // cast to MemberData
                if (memberData && memberData.username) {
                    names.push(memberData.username);
                }
            }
            setMemberNames(names);
        };

        fetchMemberNames();
    }, [BikeBusLeaders, BikeBusMembers, BikeBusName, GroupMessages, bikebusstations, routeId, schedule]);

    if (!groupData) return null;

    return (
        <IonCard>
            <IonCardHeader>
                <IonCardTitle>{groupData.BikeBusName}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <IonCardSubtitle>Leaders</IonCardSubtitle>
                {leaderNames.map((name, index) => (
                    <IonCardSubtitle key={index}>{name}</IonCardSubtitle>
                ))}
                <IonCardSubtitle>Members</IonCardSubtitle>
                {memberNames.map((name, index) => (
                    <IonCardSubtitle key={index}>{name}</IonCardSubtitle>
                ))}
                <IonCardSubtitle>Route ID</IonCardSubtitle>
                {fetchedRoutes.map((route) => (
                    <IonCardSubtitle key={route.id}>{route.routename}</IonCardSubtitle>
                ))}
                <IonCardSubtitle>Schedule</IonCardSubtitle>
            </IonCardContent>
        </IonCard>
    );
};

export default BikeBusGroup;