import { IonAlert, IonButton, IonContent, IonHeader, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/react';
import { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const Settings: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkIfUserIsAdmin = async () => {
    if (!user) return false; // Check if user object is available
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      return userDocSnap.exists() && userDocSnap.data()?.accountType === 'App Admin';
    } catch (error) {
      console.error('Error fetching user data:', error);
      return false; // Return false on error or if user is not admin
    }
  };

  const forceUpdateAddresses = async () => {
    setIsLoading(true);
    const isAdmin = await checkIfUserIsAdmin();
    if (!isAdmin) {
      console.error('User is not authorized to perform this action');
      setIsLoading(false);
      return;
    }

    const url = 'https://us-central1-bikebus-71dd5.cloudfunctions.net/forceUpdateAllRouteAddresses';
    try {
      const response = await fetch(url, {
        method: 'POST', // Use the appropriate HTTP method
        headers: {
          'Content-Type': 'application/json',
          // Add your authentication method here, such as a bearer token
          
        },
        // Include any necessary data in the body or headers
      });
      const data = await response.text();
      console.log(data);
      setShowAlert(true); // Show confirmation alert
    } catch (error) {
      console.error('Error:', error);
      // Handle errors, possibly show a notification to the user
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <IonSpinner />;
  }

  if (!user || user.accountType !== 'App Admin') {
    // If the user is not an admin or not loaded yet, don't show the button
    return <IonSpinner />;
  }

  return (
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonButton routerLink='/Account'>Back to Account</IonButton>
        <IonButton onClick={forceUpdateAddresses} disabled={isLoading}>Force Update Addresses</IonButton>
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Update Triggered'}
          message={'The update process has been initiated for all routes.'}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;

