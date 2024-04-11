// StatisticsCard.tsx
import React, { useEffect, useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonChip, IonLabel, IonText, IonTextarea } from '@ionic/react';
import DetailedStatistics from '../components/DetailedStatistics';
import { IonContent, IonModal } from '@ionic/react';
import { getDoc, doc, collection, getDocs, query, where, Timestamp, DocumentData, DocumentReference } from 'firebase/firestore';
import { useHistory, useParams } from 'react-router-dom';
import moment from 'moment';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';


interface BikeBusStatistics {
  totalHeadCount: number;
  averageHeadCount: number;
  pastTotalRSVPCount: number;
  futureTotalRSVPCount: number;
  pastAverageRSVPCount: number;
  futureAverageRSVPCount: number;
}

interface EventDetails {
  pastEventsCount: number;
  futureEventsCount: number;
  numberOfEvents: number;
  totalDuration: number;
  averageDuration: number;
  totalDistance: number;
  averageDistance: number;
}

interface Props {
  statistics: BikeBusStatistics;
}

interface BikeBusStatistics {
  pastTotalRSVPCount: number;
  futureTotalRSVPCount: number;
  pastAverageRSVPCount: number;
  futureAverageRSVPCount: number;
  totalHeadCount: number;
  averageHeadCount: number;
}

interface EventDetails {
  pastEventsCount: number;
  futureEventsCount: number;
  numberOfEvents: number;
  totalDuration: number;
  averageDuration: number;
  totalDistance: number;
  averageDistance: number;
}


interface Coordinate {
  lat: number;
  lng: number;
}

interface BulletinBoard {
  Messages: any[];
}

interface Event {
  startTimestamp: Timestamp;
  id: string;
  duration: string;
  distance: string;
  groupId: string;
  start?: { seconds: number, nanoseconds: number } | string;
  startTime: string;
  eventName: string;
  BikeBusGroup: FirestoreRef;
  timezone: string;
  rsvpCount: number;
  HeadCountEvent: number;
  leader: string[];
  captains: string[];
  sheepdogs: string[];
  sprinters: string[];
  caboose: string[];
  kids: string[];
  members: string[];
  BikeBusRoute: FirestoreRef;
}

interface FirestoreRef {
  path: string;
}

interface Member {
  id: string;
  username?: string;
  accountType: string;
  avatarUrl: string;
}


interface BikeBus {
  BikeBusRoutes: string;
  id: string;
  accountType: string;
  description: string;
  endPoint: Coordinate;
  AdditionalInformation: string;
  BikeBusCreator: string;
  BikeBusLeader: string;
  BikeBusName: string;
  BikeBusType: string;
  startPoint: Coordinate;
  travelMode: string;
}

const StatisticsCard: React.FC<Props> = () => {
  const [showFullPage, setShowFullPage] = React.useState(false);
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<string>('');
  const [groupData, setGroupData] = useState<any>(null);
  const [routesData, setRoutesData] = useState<any[]>([]);
  const [BikeBus, setBikeBus] = useState<BikeBus[]>([]);
  const [leaderData, setLeaderData] = useState<any>('');
  const [isUserLeader, setIsUserLeader] = useState<boolean>(false);
  const [isUserMember, setIsUserMember] = useState<boolean>(false);
  const [eventsData, setEventsData] = useState<Event[]>([]);

  const [username, setUsername] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>();
  const [messages, setMessages] = useState<any[]>([]);
  const [memberUserNames, setMemberUsernames] = useState<string[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const label = user?.username ? user.username : "anonymous";
  // selectedBBOROrgValue is the same value of groupId. It's used to filter the bulletin boards by the groupId.
  const [selectedBBOROrgValue, setSelectedBBOROrgValue] = useState<string>('');
  const [nextEventId, setNextEventId] = useState<string>('');
  const [nextEvent, setNextEvent] = useState<Event | null>(null); // [0] is the next event
  const [nextEventTime, setNextEventTime] = useState<string>('');
  const [membersData, setMembersData] = useState<Member[]>([]);
  const { groupId } = useParams<{ groupId?: string }>();
  const [primaryRoute, setPrimaryRoute] = useState<any>(null);
  const [timezone, setTimezone] = useState<string>('');
  const [statistics, setStatistics] = useState<BikeBusStatistics>({
    totalHeadCount: 0,
    averageHeadCount: 0,
    pastTotalRSVPCount: 0,
    futureTotalRSVPCount: 0,
    pastAverageRSVPCount: 0,
    futureAverageRSVPCount: 0,
  });

  const [eventDetails, setEventDetails] = useState<EventDetails>({
    numberOfEvents: 0,
    totalDuration: 0,
    averageDuration: 0,
    totalDistance: 0,
    averageDistance: 0,
    pastEventsCount: 0,
    futureEventsCount: 0,
  });

  // Helper function to convert event duration to a consistent unit (minutes)
  const parseDuration = (duration: string) => {
    return parseFloat(duration) || 0;
  };

  // Helper function to parse event distance
  const parseDistance = (distance: string) => {
    return parseFloat(distance) || 0;
  };

  // now set the selectedBBOROrgValue to the groupId
  useEffect(() => {
    setSelectedBBOROrgValue(groupId || '');
  }, [groupId]);

  useEffect(() => {


    const fetchData = async () => {

      if (!user?.uid) return;
      const userRef = doc(db, 'users', user.uid);
      const docSnapshot = await getDoc(userRef);
      if (!docSnapshot.exists()) return;
      const userData = docSnapshot.data();
      setAccountType(userData?.accountType || '');
      setUsername(userData?.username || '');



      const BikeBusCollection = collection(db, 'bikebusgroups');
      const q = query(BikeBusCollection, where('BikeBusMembers', 'array-contains', doc(db, 'users', `${user?.uid}`)));
      const querySnapshot = await getDocs(q);
      const BikeBusData: BikeBus[] = querySnapshot.docs.map(doc => ({
        ...doc.data() as BikeBus,
        id: doc.id,
        BikeBusName: doc.data().BikeBusName,
        BikeBusType: doc.data().BikeBusType,
        BikeBusDescription: doc.data().BikeBusDescription,
        BikeBusRoutes: doc.data().BikeBusRoutes,
        BikeBusMembers: doc.data().BikeBusMembers,
        BikeBusSchedules: doc.data().BikeBusSchedules,
        BikeBusLeader: doc.data().BikeBusLeader,
        BikeBusCreator: doc.data().BikeBusCreator,
        events: doc.data().events,
        event: doc.data().event,
        routes: doc.data().BikeBusRoutes,
      }));
      setBikeBus(BikeBusData);

      const groupRef = doc(db, 'bikebusgroups', selectedBBOROrgValue || '');
      const groupSnapshot = await getDoc(groupRef);
      if (!groupSnapshot.exists()) return;
      const groupData = groupSnapshot.data();
      setGroupData(groupData);

      const uid = user?.uid;

      if (groupData?.BikeBusLeader) {
        const leaderRef = groupData.BikeBusLeader;
        const leaderSnapshot = await getDoc(leaderRef);
        if (leaderSnapshot.exists()) {
          const leaderData = leaderSnapshot.data();
          setLeaderData(leaderData);
        }
      }

      if (groupData?.BikeBusMembers && Array.isArray(groupData.BikeBusMembers)) {
        const members = groupData.BikeBusMembers.map((member: any) => {
          return getDoc(member)
            .then((docSnapshot) => {
              if (docSnapshot.exists()) {
                const memberData = docSnapshot.data();
                return memberData ? {
                  ...memberData,
                  id: docSnapshot.id,
                } : { id: docSnapshot.id };
              } else {
                // Return a placeholder object if the member document doesn't exist
                return { id: member.id };
              }
            })
            .catch((error) => {
              // Handle the error if necessary
            });
        });
        const membersData = await Promise.all(members);
        setMembersData(membersData.filter((member) => member !== void 0) as Member[]);
        // Fetch usernames and avatars for members
        const usernamesArray = await Promise.all(
          membersData.map(async (member) => {
            if (member && 'username' in member) {
              const userRefId = typeof member === 'object' && member.username ? (member.username as string).split('/').pop() : null;
              const userRef = doc(db, 'users', userRefId ?? '');
              const userSnapshot = await getDoc(userRef);
              if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                return userData?.username;
              }
            }
            return null;
          })
        );
        setMemberUsernames(usernamesArray);
      }

      if (groupData && groupData.primaryRoute) {
        const primaryRouteRef = groupData.primaryRoute;
        const primaryRouteSnap = await getDoc(primaryRouteRef);
        if (primaryRouteSnap.exists()) {
          setPrimaryRoute({ id: primaryRouteSnap.id, ...(primaryRouteSnap.data() as object) });
        }
      }

      // let's return all of the routes for the bikebus
      const routes = groupData?.BikeBusRoutes;
      const routesArray = await Promise.all(routes.map(async (routeRef: DocumentReference<unknown, DocumentData>) => {
        const docSnapshot = await getDoc(routeRef);
        return docSnapshot.exists() ? { ...docSnapshot.data() as object, id: docSnapshot.id } : null;
      }));
      setRoutesData(routesArray.filter(e => e));
      setIsUserLeader(groupData?.BikeBusLeader.id === uid);
      setIsUserMember(groupData?.BikeBusMembers?.some((memberRef: any) => memberRef.path === `users/${uid}`));

      if (groupData && groupData.events) {
        const eventData = await Promise.all(groupData.events.map(async (eventRef: DocumentReference<unknown, DocumentData>) => {
          const docSnapshot = await getDoc(eventRef);
          return docSnapshot.exists() ? { ...docSnapshot.data() as object, id: docSnapshot.id } : null;
        }));
        setEventsData(eventData.filter(e => e));
      }

      // 
    };



    fetchData();
  }, [user, selectedBBOROrgValue]);

  useEffect(() => {
    // Log to check the structure of eventsData

    const validEvents = eventsData.filter(event => event && event.start);

    const sortedEvents = validEvents.sort((a, b) => {
      const aStart = typeof a.start === 'string' ? new Date(a.start).getTime() : (a.start?.seconds ?? 0) * 1000;
      const bStart = typeof b.start === 'string' ? new Date(b.start).getTime() : (b.start?.seconds ?? 0) * 1000;
      return aStart - bStart;
    });

    const nextEvent = sortedEvents.find(event => {
      const eventStart = typeof event.start === 'string' ? new Date(event.start).getTime() : (event.start?.seconds ?? 0) * 1000;
      return eventStart > new Date().getTime();
    });

    if (nextEvent) {
      setNextEventId(nextEvent.id);
      const nextEventTime = typeof nextEvent.start === 'string'
        ? new Date(nextEvent.start).toLocaleString()
        : new Date((nextEvent.start?.seconds ?? 0) * 1000).toLocaleString();
      setNextEventTime(nextEventTime);
      // get the timzone from the user browser
      setTimezone(moment.tz.guess());
      setNextEvent(nextEvent);


    }
  }, [eventsData]);

  useEffect(() => {
    let totalHeadCount = 0;
    let pastRSVPCount = 0;
    let futureRSVPCount = 0;
    let pastEventsCount = 0;
    let futureEventsCount = 0;

    const now = new Date().getTime();

    eventsData.forEach(event => {
        const headCount = event.HeadCountEvent || 0;
        totalHeadCount += headCount;

        const eventStartTimestamp = new Date(event.startTimestamp.seconds * 1000);
        const eventStartMillis = eventStartTimestamp.getTime();

        const rsvpCount = (event.leader.length + event.captains.length + event.sheepdogs.length + event.sprinters.length + event.caboose.length + event.kids.length + event.members.length) || 0;

        if (eventStartMillis < now) {
            pastRSVPCount += rsvpCount;
            pastEventsCount++;
        } else {
            futureRSVPCount += rsvpCount;
            futureEventsCount++;
        }
    });

    const pastAverageRSVPCount = pastEventsCount > 0 ? pastRSVPCount / pastEventsCount : 0;
    const futureAverageRSVPCount = futureEventsCount > 0 ? futureRSVPCount / futureEventsCount : 0;
    const averageHeadCount = eventsData.length > 0 ? totalHeadCount / eventsData.length : 0;

    setStatistics({
        totalHeadCount,
        pastTotalRSVPCount: pastRSVPCount,
        futureTotalRSVPCount: futureRSVPCount,
        pastAverageRSVPCount,
        futureAverageRSVPCount,
        averageHeadCount,
    });

    // Update event details similarly if needed
}, [eventsData]);


  return (
    <IonTextarea>
      <IonChip color="dark" onClick={() => setShowFullPage(true)}>
        View Detailed Statistics
      </IonChip>
      <IonModal isOpen={showFullPage} onDidDismiss={() => setShowFullPage(false)}>
        <IonContent>
          <DetailedStatistics
            statistics={statistics}
            eventDetails={eventDetails}
            onClose={() => setShowFullPage(false)}
          />
        </IonContent>
      </IonModal>
    </IonTextarea>
  );
};

export default StatisticsCard;
