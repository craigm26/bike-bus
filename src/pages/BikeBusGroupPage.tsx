import React, { useEffect, useState, useContext, useCallback } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem, IonButton, IonLabel, IonInput, IonModal, IonRouterLink, IonChip, IonAvatar, IonIcon, IonCol, IonGrid, IonRow } from '@ionic/react';
import { getDoc, doc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import { HeaderContext } from '../components/HeaderContext';
import { useParams, Link, useHistory } from 'react-router-dom';
import { updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { personCircleOutline } from 'ionicons/icons';
import Avatar from '../components/Avatar';
import QRCode from 'qrcode.react';


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
  const [membersData, setMembersData] = useState<any[]>([]);
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


  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      const userRef = doc(db, 'users', user.uid);
      const docSnapshot = await getDoc(userRef);
      if (!docSnapshot.exists()) return;
      const userData = docSnapshot.data();
      setAccountType(userData?.accountType || '');
      setUsername(userData?.username || '');
    };

    const fetchGroupData = async (id: string) => {
      const groupRef = doc(db, 'bikebusgroups', id);
      const docSnapshot = await getDoc(groupRef);
      if (!docSnapshot.exists()) return;
      const groupData = docSnapshot.data();
      setGroupData(groupData);
      const uid = user?.uid;

      setIsUserLeader(groupData?.BikeBusLeader.id === uid);
      setIsUserMember(groupData?.BikeBusMembers?.some((memberRef: any) => memberRef.path === `users/${uid}`));
    };

    const handleGroupBasedOnName = async () => {
      const BikeBusCollection = collection(db, 'bikebusgroups');
      const q = query(BikeBusCollection, where('BikeBusName', '==', BikeBusName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        await fetchGroupData(doc.id);
        history.replace(`/bikebusgrouppage/${doc.id}`);
      } else {
      }
    };

    const validRoutes = ['/bikebusgrouppage/:groupId', '/BikeBusName'];
    const route = window.location.pathname;


    if (BikeBusName) {
      handleGroupBasedOnName();
    } else if (groupId) {
      fetchGroupData(groupId);
    } else {
      history.replace('/BikeBusName');
    }

    fetchUserData();

  }

    , [BikeBusName, groupId, history, user]);

  const fetchBikeBus = useCallback(async () => {
    const uid = user?.uid;
    if (!uid) {
      return;
    }

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
  }, [user]);

  useEffect(() => {
    fetchBikeBus();
  }, [fetchBikeBus, user]);

  // take the groupData and get the routes from the references generated from the groupData. 
  const fetchRoutes = useCallback(async () => {
    if (groupData?.BikeBusRoutes && Array.isArray(groupData.BikeBusRoutes)) {
      const routes = groupData.BikeBusRoutes.map((route: any) => {
        return getDoc(route).then((docSnapshot) => {
          if (docSnapshot.exists()) {
            const routeData = docSnapshot.data();
            // Check if routeData exists before spreading
            return routeData ? {
              ...routeData,
              id: docSnapshot.id,
            } : { id: docSnapshot.id };
          } else {
          }
        })
          .catch((error) => {
          });
      });
      const routesData = await Promise.all(routes);
      setRoutesData(routesData);
    }
  }, [groupData]);

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


  const fetchMembers = useCallback(async () => {
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
      setMembersData(membersData);
      // Fetch usernames and avatars for members
      const usernamesArray = await Promise.all(
        membersData.map(async (member) => {
          if (member && member.username) {
            const userRefId = member.username.split('/').pop();
            const userRef = doc(db, 'users', userRefId);
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
  }, [groupData]);

  const fetchLeader = useCallback(async () => {
    if (groupData?.BikeBusLeader) {
      const leaderRef = groupData.BikeBusLeader;
      const leaderSnapshot = await getDoc(leaderRef);
      if (leaderSnapshot.exists()) {
        const leaderData = leaderSnapshot.data();
        setLeaderData(leaderData);
      }
    }
  }
    , [groupData]);

  const fetchLeaderUsername = useCallback(async () => {
    if (leaderData?.username) {
      const leaderUsername = leaderData.username;
      setLeaderUsername(leaderUsername);
    }
  }
    , [leaderData]);


  // featchSchedules is an array. It should use groupData.BikeBusSchedules to get the schedule document and then make the properties of the schedule document available to the BikeBusGroupPage.tsx
  const fetchSchedules = useCallback(async () => {
    if (groupData?.BikeBusSchedules && Array.isArray(groupData.BikeBusSchedules)) {
      const schedules = groupData.BikeBusSchedules.map((schedule: any) => {
        return getDoc(schedule).then((docSnapshot) => {
          if (docSnapshot.exists()) {
            const schedulesData = docSnapshot.data();
            // Check if scheduleData exists before spreading
            return schedulesData ? {
              ...schedulesData,
              id: docSnapshot.id,
              groupId: docSnapshot.id,
            } : { id: docSnapshot.id };
          } else {
          }
        })
          .catch((error) => {
          });
      }
      );
      const schedulesData = await Promise.all(schedules);
      setSchedulesData(schedulesData);
    }
  }
    , [groupData]);

  // event is a firestore collection with event documents. We should use the bikebusgorupid to lookup the event documents that belong to the bikebusgroup.
  const fetchEvents = useCallback(async () => {
    if (groupData && groupData.events) {
      const events = await Promise.all(
        groupData.events.map(async (eventRef: any) => {
          const docSnapshot = await getDoc(eventRef);
          if (docSnapshot.exists()) {
            const eventData = docSnapshot.data();
            return eventData ? {
              ...eventData,
              id: docSnapshot.id,
              groupId: docSnapshot.id,
            } : { id: docSnapshot.id };
          }
          // Return undefined if the doc doesn't exist, so it can be filtered out later
          return undefined;
        })
      );
      // Filter out undefined values from the array
      const filteredEvents = events.filter(event => event !== undefined);
      setEventsData(filteredEvents);
    }
  }, [groupData]);


  const fetchEvent = useCallback(async () => {
    if (groupData && groupData.event) {
      const events = await Promise.all(
        groupData.event.map(async (eventRef: any) => {
          const docSnapshot = await getDoc(eventRef);
          if (docSnapshot.exists()) {
            const eventData = docSnapshot.data();
            return eventData ? {
              ...eventData,
              id: docSnapshot.id,
              groupId: docSnapshot.id,
            } : { id: docSnapshot.id };
          }
          // Return undefined if the doc doesn't exist, so it can be filtered out later
          return undefined;
        })
      );
      // Filter out undefined values from the array
      const filteredEvents = events.filter(event => event !== undefined);
      setEventData(filteredEvents);
    }
  }, [groupData]);


  useEffect(() => {
    fetchRoutes();
    fetchLeader();
    fetchMembers();
    fetchEvents();
    fetchEvent();
    fetchSchedules();

  }
    , [fetchRoutes, fetchLeader, fetchMembers, groupData, fetchEvents, fetchEvent, fetchSchedules,]);

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


  // we need to ensure we have the eventData before we can use it. If it's just one event, that's acceptable too.
  useEffect(() => {
    if (eventIds.length > 0) {
      const eventDocs = eventIds
        .map((eventId: string) => doc(db, 'events', eventId))
        .filter(doc => doc !== undefined);

      setEventDocs(eventDocs);
    }
  }
    , [eventIds]);



  const validEvents = (eventData || []).filter((event: Event) =>
    event && event.start
  );

  const convertStartToMilliseconds = (
    start: string | { seconds: number; nanoseconds: number } | undefined
  ) => {
    if (typeof start === 'string') {
      return new Date(start).getTime();
    } else if (start) {
      return start.seconds * 1000;
    }
    return 0; // Default value when start is undefined
  };

  const sortedEvents = validEvents.sort((a: Event, b: Event) => {
    const aDateMilliseconds = convertStartToMilliseconds(a.start);
    const bDateMilliseconds = convertStartToMilliseconds(b.start);
    return aDateMilliseconds - bDateMilliseconds;
  });

  const nextEvent = sortedEvents.find((event: Event) => {
    const eventDateMilliseconds = convertStartToMilliseconds(event.start);
    return eventDateMilliseconds > new Date().getTime();
  });

  const nextEventId = nextEvent?.id;

  // Options to format the time
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };

  // make the nextEvent a start time that's nicely formatted for use in the ui 
  const nextEventTime = nextEvent?.start && (typeof nextEvent.start === 'string'
    ? new Date(nextEvent.start).toLocaleString(undefined, dateTimeOptions)
    : new Date(nextEvent.start.seconds * 1000).toLocaleString(undefined, dateTimeOptions));



  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{groupData?.BikeBusName}
            <IonCol>
            <QRCode size={50} value={window.location.href} />
            </IonCol>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div>
              {!isUserMember &&
                <IonButton size="small" onClick={joinBikeBus}>Join BikeBus</IonButton>
              }
              {isUserMember &&
                <IonButton size="small"  onClick={leaveBikeBus}>Leave BikeBus</IonButton>
              }
              <IonButton size="small" onClick={() => setShowInviteModal(true)}>Invite Users</IonButton>
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
              {((accountType === 'Leader' || accountType === 'Org Admin' || accountType === 'App Admin') && isUserLeader) &&
                <IonButton size='small' routerLink={`/EditBikeBus/${groupId}`}>Edit BikeBus</IonButton>
              }
              {isUserLeader && Array.isArray(routesData) && routesData.filter(route => route?.id).map((route, index) => (
                <IonItem key={index}>
                  <IonButton routerLink={`/CreateBikeBusStops/${route?.id}`}>Create BikeBusStops</IonButton>
                </IonItem>
              ))}
              <IonList>
                <IonItem>
                  <IonLabel>Leader</IonLabel>
                  <IonChip>
                    <div style={{ marginRight: '8px' }}>
                      <Avatar uid={groupData?.BikeBusLeader?.id} size="extrasmall" />
                    </div>
                  </IonChip>
                </IonItem>
                <IonItem>
                  <IonLabel>Members</IonLabel>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IonButton onClick={() => setShowMembersModal(true)} fill="clear" style={{}}>
                      <IonChip>
                        {membersData.map((user, index) => (
                          <div style={{ marginRight: '8px' }} key={index}>
                            <Avatar uid={user.id} size="extrasmall" />
                          </div>
                        ))}
                        {membersData.length > 5 && (
                          <IonChip>
                            <IonLabel>{membersData.length}</IonLabel>
                          </IonChip>
                        )}
                      </IonChip>
                    </IonButton>
                  </div>

                </IonItem>
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
                <IonItem>
                  <IonLabel>Description</IonLabel>
                  <IonLabel>{groupData?.BikeBusDescription}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>Additional Information</IonLabel>
                  <IonLabel>{groupData?.AdditionalInformation}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>Type</IonLabel>
                  <IonLabel>{groupData?.BikeBusType}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>Route</IonLabel>
                  {groupId && (
                    <IonList>
                      {Array.isArray(routesData) && routesData.filter(route => route?.id).map((route, index) => (
                        <IonItem key={index}>
                          <Link to={`/ViewRoute/${route?.id}`}>
                            <IonButton>{route?.routeName}</IonButton>
                          </Link>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </IonItem>
                <IonItem>
                  {nextEvent ?
                    <><IonLabel>Next Event:</IonLabel><Link to={`/Event/${nextEventId}`}>
                      <IonButton>{nextEventTime}</IonButton>
                    </Link></>
                    :
                    <><IonLabel>Next Event has not been scheduled yet!</IonLabel></>
                  }
                </IonItem>
                <IonItem>
                  <IonLabel>All Events</IonLabel>
                  <Link to={`/ViewSchedule/${groupId}`}>
                    <IonButton>View Schedule</IonButton>
                  </Link>
                </IonItem>
              </IonList>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent >
    </IonPage >
  );
};


export default BikeBusGroupPage;