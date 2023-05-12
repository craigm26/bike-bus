import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonButton, IonInput, IonItem, IonLabel, IonPage, IonText } from '@ionic/react';
import useAuth from '../useAuth';
import './Signup.css';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

const Signup: React.FC = () => {
    const { signUpWithEmailAndPassword } = useAuth();
    const history = useHistory();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isUsernameTaken, setIsUsernameTaken] = useState(false);

    const checkUsername = async (username: string) => {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setIsUsernameTaken(false);
        } else {
            setIsUsernameTaken(true);
        }
    };


    const handleSignup = async (email: string, password: string, username: string, firstName: string, lastName:string) => {
        try {
            // Create the user in Firebase Authentication
            const userCredential = await signUpWithEmailAndPassword(email, password, username, firstName, lastName);
            const user = userCredential.user;
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                username: username,
                accountType: 'Member',
                enabledAccountModes: ['Member'],
                firstName: firstName,
                lastName: lastName,
                email: user.email,
            });
            // Redirect the user to the home page
            history.push('/Map');
        } catch (error) {
            console.error('Error signing up:', error);
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
                <IonLabel position="floating">@Username</IonLabel>
                <IonInput
                    type="text"
                    value={username}
                    onIonChange={async (event) => {
                        setUsername(event.detail.value!)
                        await checkUsername(event.detail.value!);
                    }}
                />
            </IonItem>

            <IonButton
                onClick={() => handleSignup(email, password, username, firstName, lastName)}
                disabled={isUsernameTaken}
            >
                Sign Up
            </IonButton>

            {isUsernameTaken && (
                <IonText color="danger">
                    <p>Username is already taken.</p>
                </IonText>
            )}
        </IonPage>
    );
};

export default Signup;
