import React, { useEffect, useState, useContext, useCallback } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem, IonButton, IonLabel, IonInput, IonModal, IonRouterLink, IonChip, IonAvatar, IonIcon, IonCol, IonGrid, IonRow, IonText } from '@ionic/react';
import { getDoc, doc, collection, getDocs, query, where, Timestamp, DocumentData, DocumentReference } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import { HeaderContext } from '../components/HeaderContext';
import { useParams, Link, useHistory } from 'react-router-dom';
import { updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { personCircleOutline } from 'ionicons/icons';
import Avatar from '../components/Avatar';
import QRCode from 'qrcode.react';
import './BikeBusGroupPage.css';
import { use } from 'i18next';


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
  groupId: string;
  start?: { seconds: number, nanoseconds: number } | string;
  startTime: string;
  eventName: string;
  BikeBusGroup: FirestoreRef;
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

const BikeBusGroupPage: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const { BikeBusName, groupId } = useParams<{ BikeBusName?: string; groupId?: string }>();
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setAccountType] = useState<string>('');
  const [groupData, setGroupData] = useState<any>(null);
  const [routesData, setRoutesData] = useState<any[]>([]);
  const [BikeBus, setBikeBus] = useState<BikeBus[]>([]);
  const [leaderData, setLeaderData] = useState<any>('');
  const [schedulesData, setSchedulesData] = useState<any[]>([]);
  const [isUserLeader, setIsUserLeader] = useState<boolean>(false);
  const [isUserMember, setIsUserMember] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [eventsData, setEventsData] = useState<Event[]>([]);
  const [messagesData, setMessagesData] = useState<any[]>([]);
  const [bulletinBoard, setBulletinBoard] = useState<BulletinBoard>({ Messages: [] });
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [eventId, setEventId] = useState<string[]>([]);
  const [eventData, setEventData] = useState<any[]>([]);
  const [eventDocs, setEventDocs] = useState<any[]>([]);
  const [eventDocsData, setEventDocsData] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [imageInput, setImageInput] = useState(null);
  const [username, setUsername] = useState<string>('');
  const [usernames, setUsernames] = useState<string[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>();
  const [showEventModal, setShowEventModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [memberUserNames, setMemberUsernames] = useState<string[]>([]);
  const [leaderUserName, setLeaderUsername] = useState<string>('');
  const [leaderAvatar, setLeaderAvatar] = useState<string>('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const label = user?.username ? user.username : "anonymous";
  // selectedBBOROrgValue is the same value of groupId. It's used to filter the bulletin boards by the groupId.
  const [selectedBBOROrgValue, setSelectedBBOROrgValue] = useState<string>('');
  const [nextEventId, setNextEventId] = useState<string>('');
  const [nextEvent, setNextEvent] = useState<Event | null>(null); // [0] is the next event
  const [nextTime, setNextTime] = useState<string>('');
  const [nextEventTime, setNextEventTime] = useState<string>('');
  const [membersData, setMembersData] = useState<Member[]>([]);



  // now set the selectedBBOROrgValue to the groupId
  useEffect(() => {
    setSelectedBBOROrgValue(groupId || '');
  }, [groupId]);


  const [showFullPage, setShowFullPage] = useState(false); // State to toggle full-page layout



  const avatarElement = user ? (
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

  const togglePopover = (e: any) => {
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
  };


  const inviteUserByEmail = async () => {
    if (!inviteEmail || !groupId) {
      return;
    }

    const groupRef = doc(db, 'bikebusgroups', groupId);

    if (groupRef) {
      await updateDoc(groupRef, {
        BikeBusInvites: arrayUnion(inviteEmail),
      });
    }

    setInviteEmail('');
    setShowInviteModal(false);
    alert('Invite sent!');
  };

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
      }));
      setBikeBus(BikeBusData);

      console.log(BikeBusData);

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
      setNextEvent(nextEvent);
    }
  }, [eventsData]);

  const joinBikeBus = async () => {
    if (!user?.uid) {
      return;
    }

    const groupRef = groupId ? doc(db, 'bikebusgroups', groupId) : null;

    if (groupRef) {
      await updateDoc(groupRef, {
        BikeBusMembers: arrayUnion(doc(db, 'users', user.uid))
      });
    }

    setIsUserMember(true);
  };

  const leaveBikeBus = async () => {
    if (!user?.uid) {
      console.error("User is not logged in");
      return;
    }

    const groupRef = groupId ? doc(db, 'bikebusgroups', groupId) : null;

    if (groupRef) {
      await updateDoc(groupRef, {
        BikeBusMembers: arrayRemove(doc(db, 'users', user.uid))
      });
    }


    setIsUserMember(false);
  };

  // when the user clicks on the copyUrl button, the url is copied to the clipboard
  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert('Copied URL to clipboard!');
  };

  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
        <IonCardHeader>
          <IonGrid>
            <IonRow>
              <IonCol>
                <IonCardTitle>{groupData?.BikeBusName}</IonCardTitle>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardHeader>
        <IonCardContent>
          <div>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  {!isUserMember ? (
                    <IonButton size="small" onClick={joinBikeBus}>Join BikeBus</IonButton>
                  ) : (
                    <IonButton size="small" onClick={leaveBikeBus}>Leave BikeBus</IonButton>
                  )}
                  {isUserMember && (
                    <IonButton size="small" routerLink={`/BulletinBoards/${selectedBBOROrgValue}`}>
                      Bulletin Board
                    </IonButton>
                  )}
                  {((accountType === 'Leader' || accountType === 'Org Admin' || accountType === 'App Admin') && isUserLeader) &&
                    <IonButton size="small" routerLink={`/EditBikeBus/${groupId}`}>Edit BikeBus</IonButton>
                  }
                  <IonButton size="small" onClick={() => setShowInviteModal(true)}>Invite Users</IonButton>
                </IonCol>
                <IonModal isOpen={showInviteModal}>
                  <IonHeader>
                    <IonToolbar>
                      <IonTitle>Invite a User</IonTitle>
                    </IonToolbar>
                  </IonHeader>
                  <IonContent>
                    <IonList>
                      <IonItem>
                        <IonLabel>
                          BikeBus Name:
                          <IonRouterLink href={`https://bikebus.app/bikebusgrouppage/${groupId}`}>
                            {groupData?.BikeBusName}
                          </IonRouterLink>
                        </IonLabel>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Routes</IonLabel>
                        {Array.isArray(routesData) && routesData.filter(route => route?.id).map((route, index) => (
                          <IonRouterLink key={index}>
                            <Link to={`/ViewRoute/${route?.id}`}>
                              <IonLabel>{route?.routeName}</IonLabel>
                            </Link>
                          </IonRouterLink>
                        ))}
                      </IonItem>
                      <IonItem>
                        <IonLabel>Email</IonLabel>
                      </IonItem>
                      <IonItem>
                        <IonInput value={inviteEmail} placeholder="Enter Email" onIonChange={e => setInviteEmail(e.detail.value!)} clearInput></IonInput>
                      </IonItem>
                    </IonList>
                    <IonButton expand="full" onClick={inviteUserByEmail}>Send Invite</IonButton>
                    <IonButton expand="full" fill="clear" onClick={() => setShowInviteModal(false)}>Cancel</IonButton>
                    <IonLabel>Or hit the "Copy URL" button to paste to social media or messaging apps</IonLabel>
                    <IonButton onClick={copyUrl}>Copy URL</IonButton>
                  </IonContent>
                </IonModal>
              </IonRow>
              <IonRow>
                <IonCol size="6">
                  <IonLabel>Leader</IonLabel>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IonAvatar>
                      <Avatar uid={groupData?.BikeBusLeader?.id} size="small" />
                    </IonAvatar>
                    <IonLabel>{leaderData?.username}</IonLabel>
                  </div>
                </IonCol>
                <IonCol size="6">
                  <IonLabel>Members</IonLabel>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IonButton onClick={() => setShowMembersModal(true)} fill="clear" style={{}}>
                      {membersData.map((user, index) => (
                        <div style={{ marginRight: '4px' }} key={index}>
                          <Avatar uid={user.id} size="small" />
                        </div>
                      ))}
                      {membersData.length > 5 && (
                        <IonLabel>{membersData.length}</IonLabel>
                      )}
                    </IonButton>
                  </div>
                  <IonModal isOpen={showMembersModal}>
                    <IonHeader>
                      <IonToolbar>
                        <IonTitle>Members</IonTitle>
                      </IonToolbar>
                    </IonHeader>
                    <IonContent>
                      <IonList>
                        {membersData.map((user, index) => (
                          <IonItem key={index}>
                            <Avatar uid={user.id} />
                            <IonLabel> {user?.username}</IonLabel>
                          </IonItem>
                        ))}
                      </IonList>
                      <IonButton expand="full" fill="clear" onClick={() => setShowMembersModal(false)}>Cancel</IonButton>
                    </IonContent>
                  </IonModal>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="6">
                  <IonLabel>Description:</IonLabel>
                </IonCol>
                <IonCol size="6">
                  <IonText> {groupData?.BikeBusDescription}</IonText>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="6">
                  <IonLabel>Additional Information:</IonLabel>
                </IonCol>
                <IonCol size="6">
                  <IonLabel> {groupData?.AdditionalInformation}</IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="6">
                  <IonLabel>Type:</IonLabel>
                </IonCol>
                <IonCol size="6">
                  <IonLabel> {groupData?.BikeBusType}</IonLabel>
                </IonCol>
              </IonRow>
              <IonRow>
                {nextEvent ?
                  <>
                    <IonCol size="6">
                      <IonLabel>Next Event:</IonLabel>
                    </IonCol>
                    <IonCol size="6">
                      <Link to={`/Event/${nextEventId}`}>
                        <IonButton size="small">{nextEventTime}</IonButton>
                      </Link>
                    </IonCol>
                  </>
                  :
                  <>
                    <IonCol size="6">
                      <IonLabel>Next event has not been scheduled yet!</IonLabel>
                    </IonCol>
                    <IonCol size="6">
                      <Link to={`/addschedule/${groupId}`}>
                        <IonButton size="small">Add Event</IonButton>
                      </Link>
                    </IonCol>
                  </>
                }
              </IonRow>
              <IonRow>
                <IonCol size="6">
                  <IonLabel>View Schedule for BikeBus: </IonLabel>
                </IonCol>
                <IonCol size="6">
                  <Link to={`/ViewSchedule/${groupId}`}>
                    <IonButton size="small">Schedule</IonButton>
                  </Link>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="12">
                  <QRCode size={50} value={window.location.href} />
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
        </IonCardContent>
      </IonContent >
    </IonPage >
  );
};


export default BikeBusGroupPage;
