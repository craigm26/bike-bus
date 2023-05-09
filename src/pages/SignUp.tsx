import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonButton, IonInput, IonItem, IonLabel, IonPage, IonRadioGroup } from '@ionic/react';
import useAuth from '../useAuth';
import './Signup.css';
import { db } from '../firebaseConfig';
import { addDoc, collection } from 'firebase/firestore';
import { getAdditionalUserInfo } from '@firebase/auth';

const Signup: React.FC = () => {
    const { signUpWithEmailAndPassword, signInWithGoogle } = useAuth();
    const history = useHistory();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [accountMode, setAccountMode] = useState<string[]>([]);


    const handleSignup = async () => {
        try {
            // Create the user in Firebase Authentication
            const userCredential = await signUpWithEmailAndPassword(email, password, username);
    
            // Create a new document in the "users" collection with the user's information
            const usersCollectionRef = collection(db, 'users');
            const newUserData = {
                uid: userCredential.user.uid,
                email: email,
                username: username,
                firstName: firstName,
                lastName: lastName,
                accountMode: accountMode,
            };
            await addDoc(usersCollectionRef, newUserData);
    
            // Redirect the user to the home page
            history.push('/Map');
        } catch (error) {
            console.error('Error signing up:', error);
        }
    };

    const handleGoogleSignup = async () => {
        const userCredential = await signInWithGoogle();
        
        if (userCredential) {
          const additionalUserInfo = getAdditionalUserInfo(userCredential);
          // Check if the user is new, then create a new document in the "users" collection with the user's information
          if (additionalUserInfo?.isNewUser && userCredential.user) {
            const usersCollectionRef = collection(db, 'users');
            const newUserData = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              username: userCredential.user.displayName,
              firstName: '',
              lastName: '',
              accountMode: accountMode,
            };
            await addDoc(usersCollectionRef, newUserData);
      
            // Redirect the user to the home page
            history.push('/Map');
          }
        } else {
          console.error('Error signing in with Google');
        }
      };
      
      
    

    return (
        <IonPage>
            <IonItem>
                <IonLabel position="floating">Email</IonLabel>
                <IonInput
                    type="email"
                    value={email}
                    onIonChange={(event) => setEmail(event.detail.value!)}
                />
            </IonItem>

            <IonItem>
                <IonLabel position="floating">Password</IonLabel>
                <IonInput
                    type="password"
                    value={password}
                    onIonChange={(event) => setPassword(event.detail.value!)}
                />
            </IonItem>

            <IonItem>
                <IonLabel position="floating">@Username</IonLabel>
                <IonInput
                    type="text"
                    value={username}
                    onIonChange={(event) => setUsername(event.detail.value!)}
                />
            </IonItem>

            <IonItem>
                <IonLabel position="floating">First Name</IonLabel>
                <IonInput
                    type="text"
                    value={firstName}
                    onIonChange={(event) => setFirstName(event.detail.value!)}
                />
            </IonItem>

            <IonItem>
                <IonLabel position="floating">Last Name</IonLabel>
                <IonInput
                    type="text"
                    value={lastName}
                    onIonChange={(event) => setLastName(event.detail.value!)}
                />
            </IonItem>

            <IonItem>
                <IonLabel position="floating">Default Account Mode</IonLabel>
                <IonInput>
                    <IonRadioGroup value={accountMode} onIonChange={e => setAccountMode(e.detail.value)}>
                        <IonItem>
                            <IonLabel>Member</IonLabel>
                            <IonInput value="member" />
                        </IonItem>
                        <IonItem>
                            <IonLabel>Leader</IonLabel>
                            <IonInput value="leader" />
                        </IonItem>
                        <IonItem>
                            <IonLabel>Car Driver</IonLabel>
                            <IonInput value="car driver" />
                        </IonItem>
                        <IonItem>
                            <IonLabel>Parent</IonLabel>
                            <IonInput value="parent" />
                        </IonItem>
                        <IonItem>
                            <IonLabel>Org Admin</IonLabel>
                            <IonInput value="Org admin" />
                            <IonLabel>Org Admin</IonLabel>
                        </IonItem>
                        <IonItem>
                            <IonLabel>App Admin</IonLabel>
                            <IonInput value="app admin" />
                        </IonItem>
                    </IonRadioGroup>
                </IonInput>
            </IonItem>

            <IonButton onClick={handleSignup}>Sign Up</IonButton>
            <IonButton onClick={handleGoogleSignup}>Sign Up with Google</IonButton>

        </IonPage>
    );
};

export default Signup;
