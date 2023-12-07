import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from '@firebase/auth';
import { getStorage } from '@firebase/storage';
import { getFirestore } from '@firebase/firestore';
import { getDatabase } from 'firebase/database';
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_APP_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Add this line before initializing App Check
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-restricted-globals
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = '0d575bcc-5f6d-4dc4-bb25-c663b2d717fb';
}
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true
});

export { auth, storage, db, appCheck, analytics, rtdb, app };
