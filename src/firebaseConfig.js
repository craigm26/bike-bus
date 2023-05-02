import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB9KZ2IEQdvlBwfCocX-IxEJt3Q8fRNYz8",
  authDomain: "bikebus-71dd5.firebaseapp.com",
  databaseURL: "https://bikebus-71dd5-default-rtdb.firebaseio.com",
  projectId: "bikebus-71dd5",
  storageBucket: "bikebus-71dd5.appspot.com",
  messagingSenderId: "787807444789",
  appId: "1:787807444789:web:1dc26b53636081cc94b67c",
  measurementId: "G-QZ8WQ7JVB7"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
