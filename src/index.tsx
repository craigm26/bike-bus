import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './AuthContext';
import { BikeBusGroupProvider } from './components/BikeBusGroup/useBikeBusGroup';
import { EventProvider } from './components/BikeBusGroup/EventContext';
import { OrganizationProvider } from './components/Organizations/useOrganization';
import { IonSpinner } from '@ionic/react'; 
import './global.css';
import './i18n';
import { db } from './firebaseConfig';

const FirebaseInitializer = ({ children }: { children: React.ReactNode }) => {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {

    if (db) {
      setFirebaseInitialized(true);
    }
  }, []);

  if (!firebaseInitialized) {
    return <IonSpinner />; 
  }

  return <>{children}</>; 
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <FirebaseInitializer>
        <AuthProvider>
          <OrganizationProvider>
            <BikeBusGroupProvider>
              <EventProvider>
                <App />
              </EventProvider>
            </BikeBusGroupProvider>
          </OrganizationProvider>
        </AuthProvider>
      </FirebaseInitializer>
    </React.StrictMode>
  );
} else {
  console.error('Error: Could not find the root element to mount the app.');
}

serviceWorkerRegistration.unregister();
reportWebVitals();
