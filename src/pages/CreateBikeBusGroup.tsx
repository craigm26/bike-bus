import {
  IonContent,
  IonPage,
  IonButton,
  IonLabel,
  IonAvatar,
  IonIcon,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Help.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import { db } from '../firebaseConfig';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, arrayUnion, updateDoc, getDocs, query, where, setDoc } from 'firebase/firestore';
import React from 'react';

const CreateBikeBusGroup: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const { RouteID } = useParams<{ RouteID: string }>();
  const [BikeBusName, setBikeBusName] = useState('');
  const [BikeBusDescription, setBikeBusDescription] = useState('');
  const [BikeBusType, setBikeBusType] = useState('');

  const [isBikeBus, setIsBikeBus] = useState<boolean>(false);
  const [bulletinBoardData, setBulletinBoardData] = useState<any>(null);

  const [expectedDuration, setExpectedDuration] = useState<number>(0);

  // fetch route data from the previous step of "CreateBikeBusGroup" button with the id from the URL and user data from firestore
  const history = useHistory();

  // Fetch the route data from Firestore and set the expectedDuration
  useEffect(() => {
    const fetchRoute = async () => {
      const routeRef = doc(db, 'routes', RouteID);
      const routeSnapshot = await getDoc(routeRef);
      if (routeSnapshot.exists()) {
        const routeData = routeSnapshot.data();
        if (routeData) {
          setRoute(routeData);
          // Extract the expected duration from the routeData and set it to the expectedDuration state variable
          const duration = routeData.duration; // Replace 'duration' with the actual field name in the route document
          console.log('duration:', duration); // Check if 'duration' is correctly fetched from Firestore
          // ensure duration persists in the state variable so it can be passed to the next step
          setExpectedDuration(duration);
        }
      }
    };
    fetchRoute();
  }, [RouteID]);



  const togglePopover = (e: any) => {
    console.log('togglePopover called');
    console.log('event:', e);
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
    console.log('showPopover state:', showPopover);
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

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
          }
        }
      });
    }
  }, [user, RouteID,]);

  const label = user?.username ? user.username : "anonymous";

  if (!user || !user.uid) {
    // If the user object is null, redirect to the login page
    return <></>;
  }





  // 1. create the BikeBus with a unique document id in a collection in firestore called "BikeBusGroups"
  const createBikeBusGroup = async () => {

    // create a new BikeBus group in firestore with the schedule id
    const bikeBusData = {
      BikeBusName: BikeBusName,
      bulletinboardType: 'BikeBus',
      BikeBusDescription: BikeBusDescription,
      BikeBusType: BikeBusType,
      BikeBusRoutes: [doc(db, 'routes', RouteID)],
      BikeBusLeader: doc(db, 'users', user.uid),
      BikeBusMembers: [doc(db, 'users', user.uid)],
      BikeBusCreator: doc(db, 'users', user.uid),
      Organization: 'unclaimed',
      // add the schedule to the BikeBus group in firestore as a single document
    };


    const bikeBusRef = await addDoc(collection(db, 'bikebusgroups'), bikeBusData);
    const bikebusgroupId = bikeBusRef.id;
    console.log('bikebusgroupId:', bikebusgroupId);


    // add the bikebusgroupid to the routes collection in the firestore document for the route
    const routeRef = doc(db, 'routes', RouteID);
    await updateDoc(routeRef, {
      BikeBusGroupId: doc(db, 'bikebusgroups', bikebusgroupId),
      BikeBusName: BikeBusName,
      isBikeBus: true,
    });

    // add the bikebus group to the user's bikebusgroups array in firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      bikebusgroups: arrayUnion(doc(db, 'bikebusgroups', bikebusgroupId)),
    });
    console.log('bikebusgroupId:', bikebusgroupId); // check if the bikebusgroupId is correctly fetched from Firestore

    // create a messages document in the firestore collection "messages" for the bikebusgroup
    const messagesData = {
      BikeBusGroup: doc(db, 'bikebusgroups', bikebusgroupId),
      message: '',
      timestamp: '',
      user: '',
    };
    await addDoc(collection(db, 'messages'), messagesData);
    console.log('messagesData:', messagesData);

    // get the messages document id
    const messagesRef = await getDocs(collection(db, 'messages'));
    const messagesId = messagesRef.docs[messagesRef.docs.length - 1].id;
    console.log('messagesId:', messagesId);

    // create a reference in the bulletinboard collection in firestore for the bikebusgroup
    const bulletinBoardData = {
      BikeBusGroup: doc(db, 'bikebusgroups', bikebusgroupId),
      // make an array of messageIds references in "Messages"
      Messages: [],
    }

    // when we create the bulletinboard, we want the id of the document to be set to the id of the bikebusgroup (bikeBusRef.id)
    // set the bulletinboard document id to the bikebusgroup id
    const bulletinBoardRef = doc(db, 'bulletinboard', bikeBusRef.id);
    // now use the updateDoc or addDoc function to create the bulletinboard document in the bulletinboard collection in firestore with the bulletinBoardRef

    await setDoc(bulletinBoardRef, bulletinBoardData);
    // get the bulletinboard document id
    
  
    const bikeBusGroupRef3 = doc(db, 'bikebusgroups', bikebusgroupId);
    await updateDoc(bikeBusGroupRef3, {
      bulletinboard: doc(db, 'bulletinboard', bikeBusRef.id),
    });

    history.push(`/bikebusgrouppage/${bikebusgroupId}`);
  };

  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
        <IonItem>
          <IonLabel>BikeBus Name</IonLabel>
          <IonInput aria-label="BikeBusName"
            placeholder="BikeBus Name"
            value={BikeBusName}
            onIonChange={(e) => setBikeBusName(e.detail.value!)}
          />
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Description</IonLabel>
          <IonInput aria-label="BikeBusDescription"
            placeholder="BikeBus Description"
            value={BikeBusDescription}
            onIonChange={(e) => setBikeBusDescription(e.detail.value!)}
          />
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Type:</IonLabel>
          <IonSelect value={BikeBusType} placeholder="Select One" onIonChange={e => setBikeBusType(e.detail.value)}>
            <IonSelectOption value="Work">Work</IonSelectOption>
            <IonSelectOption value="School">School</IonSelectOption>
            <IonSelectOption value="Social">Social</IonSelectOption>
            <IonSelectOption value="Club">Club</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Route</IonLabel>
          <IonLabel>{route?.routeName}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>Starting Point</IonLabel>
          <IonLabel>{route?.startPointAddress}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>Ending Point</IonLabel>
          <IonLabel>{route?.endPointAddress}</IonLabel>
        </IonItem>
        <IonItem>
          <IonButton onClick={createBikeBusGroup}>Create BikeBus</IonButton>
        </IonItem>
      </IonContent>
    </IonPage >
  );
};

export default CreateBikeBusGroup;