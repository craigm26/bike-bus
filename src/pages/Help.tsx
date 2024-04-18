import {
  IonContent,
  IonPage,
  IonCardTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonItem,
  IonList,
  IonButton,
  IonItemGroup,
  IonInput,
  IonLabel,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useState } from 'react';
import { doc, setDoc, collection, updateDoc } from "firebase/firestore";
import { db } from '../firebaseConfig';
import { request, gql } from 'graphql-request';


const Help: React.FC = () => {
  const [openSection, setOpenSection] = useState<number>(0);
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');


  const writeMessageToFirebase = async () => {
    const date = new Date();
    const dateStr = date.toISOString();

    const finalEmail = email === "" ? "anonymous" : email;

    try {
      const docRef = doc(collection(db, "feedback"));
      await setDoc(docRef, {});

      await updateDoc(docRef, { email: finalEmail });
      await updateDoc(docRef, { message: message });
      await updateDoc(docRef, { date: dateStr });

      /* Test: Create a GitHub discussion post after setting the GitHub Token
      const endpoint = 'https://api.github.com/graphql';
      const mutation = gql`
        mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
          createDiscussion(input: {repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body}) {
            discussion {
              id
            }
          }
        }
      `;
      const variables = {
        repositoryId: "<repository-id>",
        categoryId: "<category-id>",
        title: "New Discussion",
        body: message
      };
      const headers = {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      };
      await request(endpoint, mutation, variables, headers);
      */
    } catch (e) {
      console.error("Error writing document: ", e);
    } finally {
      setEmail('');
      setMessage('');
      history.back();
    }
  }

  return (
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Help</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonCardContent>
          <div>
            <IonItem lines="none" className="message-email-item">
              <IonLabel aria-required position="floating">Email Address (Optional)</IonLabel>
              <IonInput
                required={false}
                placeholder="Email Address"
                value={email}
                onIonChange={e => setEmail(e.detail.value!)}
              ></IonInput>
            </IonItem>
            <IonItem lines="none" className="message-text-item">
              <IonLabel position="floating">Message (Required)</IonLabel>
              <IonInput
                required={true}
                placeholder="Message"
                value={message}
                onIonChange={e => setMessage(e.detail.value!)}
              ></IonInput>
            </IonItem>
            <IonButton shape="round" expand="block" className="message-send-button" onClick={writeMessageToFirebase}>Send Feedback or Ask for Help</IonButton>
          </div>
        </IonCardContent>
        <IonList>
          <IonItemGroup>
            <IonButton expand="full" onClick={() => setOpenSection(openSection !== 1 ? 1 : 0)}>How do I create a BikeBus?</IonButton>
            {openSection === 1 &&
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle >How do I create a BikeBus?</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>1. <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/Login">LogIn</IonButton></IonItem>
                    <IonItem>2. Create a Route:  <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/Help">Help</IonButton></IonItem>
                    <IonItem>3. View the Route:  <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/ViewRouteList">View your Routes</IonButton></IonItem>
                    <IonItem>4. Select the "Create BikeBus Group" button</IonItem>
                    <IonItem>5. Fill in the "Create BikeBus" form</IonItem>
                    <IonItem>6. Create your schedule of upcoming events</IonItem>
                    <IonItem>7. Invite people to join the BikeBus or share the event</IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            }
          </IonItemGroup>
          <IonItemGroup>
            <IonButton expand="full" onClick={() => setOpenSection(openSection !== 8 ? 8 : 0)}>How do I enable Live Tracking for my BikeBus?</IonButton>
            {openSection === 8 &&
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>How do I enable Live Tracking for my BikeBus?</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>1. Go to the BikeBus Page</IonItem>
                    <IonItem>2. Click on the event you want to RSVP for</IonItem>
                    <IonItem>3. Click on the "RSVP" button</IonItem>
                    <IonItem>4. Choose the "Leader" Role to fill during the BikeBus</IonItem>
                    <IonItem>5. Save the RSVP</IonItem>
                    <IonItem>6. To start the Live Tracking, click on the "Start Event" button on the event page</IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            }
          </IonItemGroup>
          <IonItemGroup>
            <IonButton expand="full" onClick={() => setOpenSection(openSection !== 2 ? 2 : 0)}>How do I create an Event?</IonButton>
            {openSection === 2 &&
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>How do I create an Event?</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>1. Go to the BikeBus Directory</IonItem>
                    <IonItem>2. Click on a BikeBus</IonItem>
                    <IonItem>3. Click on the "Create Event" button</IonItem>
                    <IonItem>4. Fill in the "Create Event" form</IonItem>
                    <IonItem>5. Click on the "Create Event" button</IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            }
          </IonItemGroup>
          <IonItemGroup>
            <IonButton expand="full" onClick={() => setOpenSection(openSection !== 6 ? 6 : 0)}>How do I RSVP for a BikeBus?</IonButton>
            {openSection === 6 &&
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>How do I RSVP for a BikeBus?</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>1. Go to the BikeBus Directory</IonItem>
                    <IonItem>2. Click on a BikeBus</IonItem>
                    <IonItem>3. Click on a upcoming event</IonItem>
                    <IonItem>4. Click on the "RSVP" button</IonItem>
                    <IonItem>5. Choose a Role to fill during the BikeBus</IonItem>
                    <IonItem>6. If you can't make it, click on the "Cancel RSVP" button</IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            }
          </IonItemGroup>
          <IonItemGroup>
            <IonButton expand="full" onClick={() => setOpenSection(openSection !== 7 ? 7 : 0)}>How do I create a Route?</IonButton>
            {openSection === 7 &&
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>How do I create a Route?</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>1. Go to the Map Page</IonItem>
                    <IonItem>2. Search for a Starting Location</IonItem>
                    <IonItem>3. Search for a Destination</IonItem>
                    <IonItem>4. Click on the "Get Directions" button</IonItem>
                    <IonItem>5. Click on the "Create Route" button</IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            }
          </IonItemGroup>
          <IonItemGroup>
            <IonButton expand="full" onClick={() => setOpenSection(openSection !== 3 ? 3 : 0)}>How do I join a BikeBus?</IonButton>
            {openSection === 3 &&
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>How do I join a BikeBus?</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>1. First, you should be signed up as a User</IonItem>
                    <IonItem>2. Click on the hamburger menu in the left-hand corner and find the "Search for BikeBus"</IonItem>
                    <IonItem>3. Click on the "Start Map by Retrieving your Current Location"</IonItem>
                    <IonItem>4. If you don't see any BikeBus near you, zoom out or start a BikeBus by establishing a route</IonItem>
                    <IonItem>5. If you do see a BikeBus that's near you, click on the map markers to see the button to view the BikeBus</IonItem>
                    <IonItem>6. Click on the "View BikeBus" button</IonItem>
                    <IonItem>7. If you like the route and the schedule, click on the "Join BikeBus" button</IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            }
          </IonItemGroup>
          <IonItemGroup>
            <IonButton expand="full" onClick={() => setOpenSection(openSection !== 4 ? 4 : 0)}>What are the roles in a BikeBus?</IonButton>
            {openSection === 4 &&
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>What are the roles in a BikeBus?</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>1. Leader: Schedules the BikeBus, makes adjustments to the route and starts the BikeBus in the app.</IonItem>
                    <IonItem>2. Members: Everyone is considered a member of the BikeBus when they join the BikeBus or make an RSVP to an Event.</IonItem>
                    <IonItem>3. Captains: Front of the BikeBus and keeping track of time.</IonItem>
                    <IonItem>4. Sheepdogs: Ride alongside the BikeBus, keeping the group together.</IonItem>
                    <IonItem>5. Sprinters: Ride back and forth to help block intersections when encountered. When the BikeBus has cleared the intersection, head to the front.</IonItem>
                    <IonItem>6. Parents: Parents can help their Kid RSVP for an event or help other kids enjoy the BikeBus.</IonItem>
                    <IonItem>7. Kids: Have fun!</IonItem>
                    <IonItem>8. Caboose: Keep to the back to handle any stragglers</IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            }
          </IonItemGroup>
          <IonItemGroup>
            <IonButton expand="full" onClick={() => setOpenSection(openSection !== 5 ? 5 : 0)}>How do I invite people to my BikeBus?</IonButton>
            {openSection === 5 &&
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>How do I invite people to my BikeBus?</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>This section is still under construction.</IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            }
          </IonItemGroup>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Help;
