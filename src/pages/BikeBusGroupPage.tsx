import React, { useEffect, useState, useContext, useCallback } from 'react';
import { IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem, IonButton, IonLabel, IonInput, IonModal, IonRouterLink, IonChip, IonAvatar, IonIcon } from '@ionic/react';
import { getDoc, doc, collection, getDocs, query, where, deleteDoc, addDoc, serverTimestamp, DocumentReference } from 'firebase/firestore';
import { db, storage, firebase } from '../firebaseConfig';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import { HeaderContext } from '../components/HeaderContext';
import { useParams, Link } from 'react-router-dom';
import { updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { personCircleOutline } from 'ionicons/icons';
import Avatar from '../components/Avatar';


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
  const [messageInput, setMessageInput] = useState('');
  const [imageInput, setImageInput] = useState(null);
  const [username, setUsername] = useState<string>('');
  const [usernames, setUsernames] = useState<string[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>();
  const [showEventModal, setShowEventModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [memberUserNames, setMemberUsernames] = useState<string[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);


  const headerContext = useContext(HeaderContext);

  const label = user?.username ? user.username : "anonymous";

  const [showFullPage, setShowFullPage] = useState(false); // State to toggle full-page layout

  const loadMoreMessages = () => {
    // Fetch additional messages from the server or load from a local data source
    fetchMessages().then((newMessages) => {
      // Append the newly fetched messages to the existing message list
      if (newMessages !== undefined) {
        setMessages((prevState: any[]) => [...prevState, ...newMessages]);
      }
    }
    );
    // Update the 'messages' state with the loaded messages
    messagesData.length > messages.length && setMessages(messagesData);
  };

  const handleScroll = (event: { target: { scrollHeight: number; scrollTop: number; clientHeight: number; }; }) => {
    const scrollThreshold = 100; // Adjust this value based on your layout and requirements

    // Check if the user has scrolled to the bottom or the specified threshold
    const scrolledToBottom =
      event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight;
    const scrolledToThreshold = event.target.scrollTop > scrollThreshold;

    if (scrolledToBottom && messagesData.length > messages.length) {
      // Load more messages only if there are actual messages to load
      loadMoreMessages();
    }

    if (scrolledToThreshold) {
      setShowFullPage(true);
    }
  };



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

    const groupRef = doc(db, 'bikebusgroups', groupId);
    getDoc(groupRef)
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const groupData = docSnapshot.data();
          setGroupData(groupData);

          if (groupData?.BikeBusLeaders?.some((leaderRef: any) => leaderRef.path === `users/${user?.uid}`)) {
            setIsUserLeader(true);
          }

          if (groupData?.BikeBusMembers?.some((memberRef: any) => memberRef.path === `users/${user?.uid}`)) {
            setIsUserMember(true);
          }
        } else {
        }
      })
      .catch((error) => {
      });

  }, [user, groupId, username]);

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
          }
        })
          .catch((error) => {
          });
      }
      );
      const leadersData = await Promise.all(leaders);
      setLeadersData(leadersData);
    }
  }, [groupData]);

  const inviteUserByEmail = async () => {
    if (!inviteEmail) {
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
    const events = await Promise.all(
      groupData.event?.map(async (eventRef: any) => {
        const docSnapshot = await getDoc(eventRef);
        if (docSnapshot.exists()) {
          const eventData = docSnapshot.data();
          return eventData ? {
            ...eventData,
            id: docSnapshot.id,
            groupId: docSnapshot.id,
          } : { id: docSnapshot.id };
        } else {
        }
      }) || []
    );
    setEventsData(events);
  }, [groupData]);


  const fetchBulletinBoard = useCallback(async () => {
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

  const fetchMessages = useCallback(async () => {
    if (groupData?.bulletinboard) {
      const bulletinBoardRef = groupData.bulletinboard;
      const bulletinBoardDoc = await getDoc(bulletinBoardRef);

      if (bulletinBoardDoc.exists()) {
        const bulletinBoardData = bulletinBoardDoc.data() as BulletinBoard;
        const messagesData = bulletinBoardData?.Messages || [];

        const messagesPromises = messagesData.map(async (messageRef: DocumentReference) => {
          const messageDoc = await getDoc(messageRef);
          if (messageDoc.exists()) {
            console.log("messageDoc exists");
            const messageData = messageDoc.data();
            console.log("messageData: ", messageData);

            // Make sure the user reference exists
            if (messageData?.user) {
              console.log("messageData: ", messageData);
              const userDoc = await getDoc(messageData.user);
              const userData = userDoc.data();

              // return combined message data and user data, but also include the userDoc's id
              return {
                ...messageData,
                user: userData ? {
                  ...userData,
                  id: userDoc.id,  // Include the document ID here
                } : null,
              };
            } else {
              console.log("User reference is missing in the message");
            }
          } else {
            console.log("messageDoc does not exist");
          }
        });

        const resolvedMessages = await Promise.all(messagesPromises);
        setMessagesData(resolvedMessages || []);

      } else {
        // Handle the case when the bulletin board document doesn't exist
      }
    } else {
      // Handle the case when the bulletin board reference is missing
    }
  }, [groupData]);


  useEffect(() => {
    fetchRoutes();
    fetchLeaders();
    fetchMembers();
    fetchEvents();
    fetchSchedules();
    fetchBulletinBoard();
    fetchMessages();
  }
    , [fetchRoutes, fetchLeaders, fetchMembers, groupData, fetchEvents, fetchSchedules, fetchBulletinBoard, fetchMessages]);


  const submitMessage = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();

    if (!user?.uid) {
      return;
    }

    // Instead of getting 'bulletinboards' collection, get 'messages' collection directly
    const messagesRef = collection(db, 'messages');
    // create a new document in the messages collection
    const messagesDoc = await addDoc(messagesRef, {
      message: messageInput,
      user: doc(db, 'users', user.uid),
      username: username,
      BikeBusGroup: doc(db, 'bikebusgroups', groupId),
      timestamp: serverTimestamp(),
      bulletinboard: doc(db, 'bulletinboard', groupData.bulletinboard.id),
    });
    const messageDoc = messagesDoc.id;
    try {

      // update the bulletinboard by adding a docref of the messages document to the bulletinboard Messages array
      const bulletinBoardRef = doc(db, 'bulletinboard', groupData.bulletinboard.id);
      await updateDoc(bulletinBoardRef, {
        Messages: arrayUnion(doc(db, 'messages', messageDoc)) // need to get the id of the messages document that was just created and add it to the array
      });


      // Clear the message input field
      setMessageInput('');
      postMessage('');

      fetchMessages();

    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };



  const joinBikeBus = async () => {
    if (!user?.uid) {
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

  const validEvents = eventsData.filter((event: Event) =>
    event.start &&
    typeof event.start !== 'string' &&
    event.BikeBusGroup.path === `bikebusgroups/${groupId}`
  );

  const sortedEvents = validEvents.sort((a: Event, b: Event) => {
    const aDate = a.start && (typeof a.start === 'string' ? new Date(a.start) : new Date(a.start.seconds * 1000));
    const bDate = b.start && (typeof b.start === 'string' ? new Date(b.start) : new Date(b.start.seconds * 1000));
    return aDate && bDate ? aDate.getTime() - bDate.getTime() : 0;
  });


  const nextEvent = sortedEvents.find((event: Event) => {
    const eventDate = event.start && (typeof event.start === 'string' ? new Date(event.start) : new Date(event.start.seconds * 1000));
    return eventDate ? eventDate.getTime() > new Date().getTime() : false;
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
    <IonPage>
      <IonContent onIonScroll={handleScroll} fullscreen>
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
              {isUserMember && (
                <IonList>
                  <form onSubmit={submitMessage}>
                    <IonInput
                      value={messageInput}
                      placeholder="Enter your message"
                      onIonChange={e => setMessageInput(e.detail.value || '')}
                    />
                    <IonButton expand="full" type="submit">Send Bulletin Board Message</IonButton>
                  </form>
                  {messagesData && messagesData.length > 0 && messagesData
                    .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp in descending order
                    .map((message, index) => {
                      console.log(message);
                      return (
                        <IonItem key={index}>
                          {username !== message?.username && (
                            <Avatar uid={message?.user?.id} size='extrasmall' />
                          )}
                          <IonLabel className={username === message?.username ? 'right-align' : 'left-align'}>
                            {message?.message}
                          </IonLabel>
                          {username === message?.username && (
                            <Avatar uid={message?.user?.id} size='extrasmall' />
                          )}
                        </IonItem>
                      );
                    })}
                </IonList>
              )}


            </div>
          </IonCardContent>
        </IonCard>
      </IonContent >
    </IonPage >
  );
};


export default BikeBusGroupPage;