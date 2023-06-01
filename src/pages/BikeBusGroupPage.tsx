import React, { useEffect, useState, useContext, useCallback } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem, IonButton, IonLabel, IonText } from '@ionic/react';
import { getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import { HeaderContext } from '../components/HeaderContext';
import { useParams, Link } from 'react-router-dom';
import { schedule } from 'firebase-functions/v1/pubsub';
import { updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useHistory } from 'react-router-dom';

interface Coordinate {
  lat: number;
  lng: number;
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

interface Schedule {
  id: string;
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



  useEffect(() => {
    fetchRoutes();
    fetchLeaders();
    fetchMembers();
    fetchSchedules();
  }
    , [fetchRoutes, fetchLeaders, fetchMembers, groupData, fetchSchedules]);

  console.log(groupData);

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
            {!isUserMember &&
              <IonButton onClick={joinBikeBus}>Join BikeBus</IonButton>
            }
            {isUserMember &&
              <IonButton onClick={leaveBikeBus}>Leave BikeBus</IonButton>
            }
            <IonButton>Invite Users</IonButton>
            {((accountType === 'Leader' || accountType === 'Org Admin' || accountType === 'App Admin') && isUserLeader) &&
              <IonButton routerLink={`/EditBikeBus/${groupId}`}>Edit BikeBus</IonButton>
            }
            <IonList>
              <IonItem>
                <IonLabel>Leaders</IonLabel>
                <IonList>
                  {leadersData.map((users, index) => (
                    <IonItem key={index}>
                      <IonLabel>{users?.username}</IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              </IonItem>
              <IonItem>
                <IonLabel>Members</IonLabel>
                <IonList>
                  {membersData.map((users, index) => (
                    <IonItem key={index}>
                      <IonLabel>{users?.username}</IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              </IonItem>
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
                <IonList>
                  {routesData.map((route, index) => (
                    <IonItem key={index}>
                      <Link to={`/ViewRoute/${route.id}`}>
                        <IonButton>{route?.routeName}</IonButton>
                      </Link>
                    </IonItem>
                  ))}
                </IonList>
              </IonItem>
              <IonItem>
                <IonLabel>Schedules</IonLabel>
                <IonList>
                  {schedulesData.map((schedule, index) => (
                    <IonItem key={index}>
                      <Link to={`/ViewSchedule/${schedule.id}`}>
                        <IonButton>{schedule?.scheduleName}</IonButton>
                      </Link>
                    </IonItem>
                  ))}
                </IonList>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage >
  );
};


export default BikeBusGroupPage;
