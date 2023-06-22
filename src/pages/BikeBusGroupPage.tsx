import React, { useEffect, useState, useContext, useCallback } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem, IonButton, IonLabel, IonText, IonInput, IonModal, IonRouterLink } from '@ionic/react';
import { getDoc, doc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import { HeaderContext } from '../components/HeaderContext';
import { useParams, Link } from 'react-router-dom';
import { updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

interface Coordinate {
  lat: number;
  lng: number;
}

interface BulletinBoard {
  Messages: any[];
}

interface Event {
  id: string;
  groupId: string;
  start?: { seconds: number, nanoseconds: number } | string;
  startTime: string;  // adjust the type based on your data
  eventName: string;  // adjust the type based on your data
}


interface BikeBus {
  BikeBusRoutes: string;
  id: string;
  accountType: string;
  description: string;
  endPoint: Coordinate;
  BikeBusCreator: string;
  BikeBusLeader: string;
  BikeBusName: string;
  BikeBusType: string;
  startPoint: Coordinate;
  travelMode: string;
}

const BikeBusGroupPage: React.FC = () => {
  const { user } = useAuth();
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setAccountType] = useState<string>('');
  const [groupData, setGroupData] = useState<any>(null);
  const { groupId } = useParams<{ groupId: string }>();
  const [routesData, setRoutesData] = useState<any[]>([]);
  const [BikeBus, setBikeBus] = useState<BikeBus[]>([]);
  const [membersData, setMembersData] = useState<any[]>([]);
  const [leadersData, setLeadersData] = useState<any[]>([]);
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

  const headerContext = useContext(HeaderContext);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setAccountType(userData.accountType);
          }
        }
      });
    }

    const groupRef = doc(db, 'bikebusgroups', groupId);
    getDoc(groupRef)
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const groupData = docSnapshot.data();
          setGroupData(groupData);

          if (groupData?.BikeBusLeaders?.some((leaderRef: any) => leaderRef.path === `users/${user?.uid}`)) {
            setIsUserLeader(true);
            console.log('User is a leader');
          }

          if (groupData?.BikeBusMembers?.some((memberRef: any) => memberRef.path === `users/${user?.uid}`)) {
            setIsUserMember(true);
            console.log('User is a member');
          }
        } else {
          console.log("No such document!");
        }
      })
      .catch((error) => {
        console.log("Error getting group document:", error);
      });
  }, [user, groupId]);

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
    }));
    setBikeBus(BikeBusData);
  }, [user]);

  useEffect(() => {
    console.log(user);
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
            console.log("No such document!");
          }
        })
          .catch((error) => {
            console.log("Error getting route document:", error);
          });
      });
      const routesData = await Promise.all(routes);
      setRoutesData(routesData);
    }
  }, [groupData]);

  const fetchLeaders = useCallback(async () => {
    if (groupData?.BikeBusLeaders && Array.isArray(groupData.BikeBusLeaders)) {
      const leaders = groupData.BikeBusLeaders.map((leader: any) => {
        return getDoc(leader).then((docSnapshot) => {
          if (docSnapshot.exists()) {
            const leaderData = docSnapshot.data();
            // Check if leaderData exists before spreading
            return leaderData ? {
              ...leaderData,
              id: docSnapshot.id,
            } : { id: docSnapshot.id };
          } else {
            console.log("No such document!");
          }
        })
          .catch((error) => {
            console.log("Error getting leader document:", error);
          });
      }
      );
      const leadersData = await Promise.all(leaders);
      setLeadersData(leadersData);
    }
  }, [groupData]);

  const inviteUserByEmail = async () => {
    if (!inviteEmail) {
      console.error("No email entered");
      return;
    }

    const groupRef = doc(db, 'bikebusgroups', groupId);

    await updateDoc(groupRef, {
      BikeBusInvites: arrayUnion(inviteEmail)
    });

    setInviteEmail('');
    setShowInviteModal(false);
    alert('Invite sent!');
  };

  const fetchMembers = useCallback(async () => {
    if (groupData?.BikeBusMembers && Array.isArray(groupData.BikeBusMembers)) {
      const members = groupData.BikeBusMembers.map((member: any) => {
        return getDoc(member).then((docSnapshot) => {
          if (docSnapshot.exists()) {
            const memberData = docSnapshot.data();
            // Check if memberData exists before spreading
            return memberData ? {
              ...memberData,
              id: docSnapshot.id,
            } : { id: docSnapshot.id };
          } else {
            console.log("No such document!");
          }
        })
          .catch((error) => {
            console.log("Error getting member document:", error);
          });
      }
      );
      const membersData = await Promise.all(members);
      setMembersData(membersData);
    }
  }
    , [groupData]);


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
            console.log("No such document!");
          }
        })
          .catch((error) => {
            console.log("Error getting schedule document:", error);
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
    console.log("fetchEvents called");
    console.log("groupData", groupData);
    console.log("groupData.BikeBusEvents", groupData.events);
    const events = await Promise.all(
      groupData.events?.map(async (eventRef: any) => {
        const docSnapshot = await getDoc(eventRef);
        if (docSnapshot.exists()) {
          const eventData = docSnapshot.data();
          return eventData ? {
            ...eventData,
            id: docSnapshot.id,
            groupId: docSnapshot.id,
          } : { id: docSnapshot.id };
        } else {
          console.log("No such document!");
        }
      }) || []
    );
    setEventsData(events);
  }, [groupData]);

  const fetchBulletinBoard = useCallback(async () => {
    console.log("fetchBulletinBoard called");
    if (groupData?.bulletinboard) {
      const bulletinBoardRef = groupData.bulletinboard;
      const bulletinBoardDoc = await getDoc(bulletinBoardRef);

      if (bulletinBoardDoc.exists()) {
        const bulletinBoardData = bulletinBoardDoc.data() as BulletinBoard;
        const messagesData = bulletinBoardData?.Messages || [];
        setMessagesData(messagesData);
      } else {
        // Handle the case when the bulletin board document doesn't exist
      }
    } else {
      // Handle the case when the bulletin board reference is missing
    }

    // Move this line inside the fetchBulletinBoard function
  }, [groupData]);



  useEffect(() => {
    fetchRoutes();
    fetchLeaders();
    fetchMembers();
    fetchEvents();
    fetchSchedules();
    fetchBulletinBoard();
  }
    , [fetchRoutes, fetchLeaders, fetchMembers, groupData, fetchEvents, fetchSchedules, fetchBulletinBoard]);


  const joinBikeBus = async () => {
    if (!user?.uid) {
      console.error("User is not logged in");
      return;
    }

    const groupRef = doc(db, 'bikebusgroups', groupId);

    await updateDoc(groupRef, {
      BikeBusMembers: arrayUnion(doc(db, 'users', user.uid))
    });

    setIsUserMember(true);
  };

  const leaveBikeBus = async () => {
    if (!user?.uid) {
      console.error("User is not logged in");
      return;
    }

    const groupRef = doc(db, 'bikebusgroups', groupId);

    await updateDoc(groupRef, {
      BikeBusMembers: arrayRemove(doc(db, 'users', user.uid))
    });

    setIsUserMember(false);
  };

  // when the user clicks on the copyUrl button, the url is copied to the clipboard
  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert('Copied URL to clipboard!');
  };

  const validEvents = eventsData.filter((event: Event) => event.start && typeof event.start !== 'string');
  const sortedEvents = validEvents.sort((a: Event, b: Event) => {
    const aDate = a.start && (typeof a.start === 'string' ? new Date(a.start) : new Date(a.start.seconds * 1000));
    const bDate = b.start && (typeof b.start === 'string' ? new Date(b.start) : new Date(b.start.seconds * 1000));
    return aDate && bDate ? aDate.getTime() - bDate.getTime() : 0;
  });

  console.log("sortedEvents", sortedEvents);

  const nextEvent = sortedEvents.find((event: Event) => {
    const eventDate = event.start && (typeof event.start === 'string' ? new Date(event.start) : new Date(event.start.seconds * 1000));
    return eventDate ? eventDate.getTime() > new Date().getTime() : false;
  });

  console.log("nextEvent", nextEvent);

  const nextEventId = nextEvent?.id;
  console.log("nextEventId", nextEventId);

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
    <IonPage>
      <IonContent fullscreen>
        {headerContext?.showHeader && (
          <IonHeader>
            <IonToolbar>
              <IonTitle>{groupData?.BikeBusName}</IonTitle>
            </IonToolbar>
          </IonHeader>
        )}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{groupData?.BikeBusName}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div>
              {!isUserMember &&
                <IonButton onClick={joinBikeBus}>Join BikeBus</IonButton>
              }
              {isUserMember &&
                <IonButton onClick={leaveBikeBus}>Leave BikeBus</IonButton>
              }
              <IonButton onClick={() => setShowInviteModal(true)}>Invite Users</IonButton>

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
                      {routesData.map((route, index) => (
                        <IonRouterLink key={index}>
                          <Link to={`/ViewRoute/${route.id}`}>
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
                <IonButton routerLink={`/EditBikeBus/${groupId}`}>Edit BikeBus</IonButton>
              }
              {isUserLeader && routesData.map((route, index) => (
                <IonItem key={index}>
                  <IonButton routerLink={`/CreateBikeBusStops/${route.id}`}>Create BikeBusStops</IonButton>
                  <IonButton routerLink={`/DeleteBikeBusStops/${route.id}`}>Delete BikeBusStops</IonButton>

                </IonItem>
              ))}
              <IonList>
                {leadersData.map((users, index) => (
                  <IonItem key={index}>
                    <IonLabel>Leaders</IonLabel>
                    <IonLabel>{users?.username}</IonLabel>
                  </IonItem>
                ))}
                <IonList>
                  {membersData.map((users, index) => (
                    <IonItem key={index}>
                      <IonLabel>Members</IonLabel>
                      <IonLabel>{users?.username}</IonLabel>
                    </IonItem>
                  ))}
                </IonList>
                <IonItem>
                  <IonLabel>Description</IonLabel>
                  <IonLabel>{groupData?.BikeBusDescription}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>Type</IonLabel>
                  <IonLabel>{groupData?.BikeBusType}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>Routes</IonLabel>
                  {groupId && (
                    <IonList>
                      {routesData.map((route, index) => (
                        <IonItem key={index}>
                          <Link to={`/ViewRoute/${route.id}`}>
                            <IonButton>{route?.routeName}</IonButton>
                          </Link>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </IonItem>
                <IonItem>
                  <IonLabel>Next Event:</IonLabel>
                  <Link to={`/Event/${nextEventId}`}>
                    <IonButton>{nextEventTime}</IonButton>
                  </Link>

                </IonItem>
                <IonItem>
                  <IonLabel>All Events</IonLabel>
                  <Link to={`/ViewSchedule/${groupId}`}>
                    <IonButton>View Schedule</IonButton>
                  </Link>
                </IonItem>
              </IonList>
              <IonList>
                <IonText>BulletinBoard</IonText>
                {messagesData.map((message, index) => (
                  <IonItem key={index}>
                    <IonLabel>{message?.message}</IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent >
    </IonPage >
  );
};


export default BikeBusGroupPage;