import React, { useEffect, useState } from 'react';
import { IonPage, IonInput, IonButton, IonLabel, IonItem, IonContent, IonCard, IonCardContent, IonCardHeader, IonSelect, IonSelectOption } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import useAuth from '../useAuth';
import moment from 'moment-timezone';

const SetUserDetails: React.FC = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUsername(userData.username || '');
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          setSelectedTimezone(userData.timezone || ''); 
          // Set other fields as needed
        } else {
          console.log("No such document!");
        }
      }
    };

    fetchUserDetails();
  }, [user]);

  const saveUserDetails = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: username,
        firstName: firstName,
        lastName: lastName,
        timezone: selectedTimezone,
        // Include other fields as needed
      });
      // Provide feedback and/or navigate
      history.push('/Account');
    }
  };

  const currentTimeInTimezone = selectedTimezone ? moment.tz(selectedTimezone).format('YYYY-MM-DD HH:mm:ss z') : '';


  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
        <IonCard className="ion-justify-content-center">
          <IonCardHeader>Set User Details</IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonInput
                placeholder="First Name"
                value={firstName}
                onIonChange={(e) => setFirstName(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonInput
                placeholder="Last Name"
                value={lastName}
                onIonChange={(e) => setLastName(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonInput
                placeholder="Username"
                value={username}
                onIonChange={(e) => setUsername(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonLabel>Time Zone:</IonLabel>
              <IonSelect value={selectedTimezone} onIonChange={e => setSelectedTimezone(e.detail.value)} placeholder="Select Time Zone">
                {/* Timezone Options */}
                {/* North America */}
              <IonSelectOption value="America/St_Johns">Newfoundland Time</IonSelectOption>
              <IonSelectOption value="America/Halifax">Atlantic Time</IonSelectOption>
              <IonSelectOption value="America/New_York">Eastern Time</IonSelectOption>
              <IonSelectOption value="America/Chicago">Central Time</IonSelectOption>
              <IonSelectOption value="America/Denver">Mountain Time</IonSelectOption>
              <IonSelectOption value="America/Phoenix">Mountain Time (no DST)</IonSelectOption>
              <IonSelectOption value="America/Los_Angeles">Pacific Time</IonSelectOption>
              <IonSelectOption value="America/Anchorage">Alaska Time</IonSelectOption>
              <IonSelectOption value="Pacific/Honolulu">Hawaii Time</IonSelectOption>
              <IonSelectOption value="America/Adak">Hawaii Time (no DST)</IonSelectOption>

              {/* South America */}
              <IonSelectOption value="America/Caracas">Venezuela Time</IonSelectOption>
              <IonSelectOption value="America/Bogota">Colombia Time</IonSelectOption>
              <IonSelectOption value="America/Sao_Paulo">Brazil Time</IonSelectOption>
              <IonSelectOption value="America/Argentina/Buenos_Aires">Argentina Time</IonSelectOption>

              {/* Europe */}
              <IonSelectOption value="Europe/London">Greenwich Mean Time</IonSelectOption>
              <IonSelectOption value="Europe/Paris">Central European Time</IonSelectOption>
              <IonSelectOption value="Europe/Istanbul">Eastern European Time</IonSelectOption>
              <IonSelectOption value="Europe/Moscow">Moscow Time</IonSelectOption>

              {/* Africa */}
              <IonSelectOption value="Africa/Cairo">Eastern Africa Time</IonSelectOption>
              <IonSelectOption value="Africa/Johannesburg">South Africa Standard Time</IonSelectOption>

              {/* Asia */}
              <IonSelectOption value="Asia/Beirut">Arabia Standard Time</IonSelectOption>
              <IonSelectOption value="Asia/Tokyo">Japan Standard Time</IonSelectOption>
              <IonSelectOption value="Asia/Kolkata">India Standard Time</IonSelectOption>
              <IonSelectOption value="Asia/Shanghai">China Standard Time</IonSelectOption>

              {/* Australia/Oceania */}
              <IonSelectOption value="Australia/Sydney">Australian Eastern Time</IonSelectOption>
              <IonSelectOption value="Pacific/Auckland">New Zealand Time</IonSelectOption>

              {/* Etcetera */}
              <IonSelectOption value="UTC">Coordinated Universal Time</IonSelectOption>
              </IonSelect>
            </IonItem>
            {selectedTimezone && (
              <IonItem>
                <IonLabel>
                  Current Time: {currentTimeInTimezone}
                </IonLabel>
              </IonItem>
            )}
            <IonButton onClick={saveUserDetails}>Save Details</IonButton>
            <IonButton routerLink="/Account">Cancel</IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default SetUserDetails;
