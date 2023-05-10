import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonButton, IonInput, IonItem, IonLabel, IonPage, IonText } from '@ionic/react';
import useAuth from '../useAuth';
import './Signup.css';
import { db } from '../firebaseConfig';
import { addDoc, collection, query, where, getDocs, CollectionReference, DocumentData, QuerySnapshot, doc, setDoc } from 'firebase/firestore';
import { getAdditionalUserInfo } from '@firebase/auth';

interface UserData {
    uid: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    accountType: string;
    enabledAccountModes: string[];
}

const Signup: React.FC = () => {
    const { signUpWithEmailAndPassword, signInWithGoogle } = useAuth();
    const history = useHistory();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isUsernameTaken, setIsUsernameTaken] = useState(false);


    const createUserDocument = async (
        usersCollectionRef: CollectionReference<DocumentData>,
        newUserData: UserData
    ) => {
        const q = query(usersCollectionRef, where('uid', '==', newUserData.uid));
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

        if (querySnapshot.empty) {
            await addDoc(usersCollectionRef, newUserData);
        }
    };

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


    const handleSignup = async (email: string, password: string, username: string) => {
        try {
            // Create the user in Firebase Authentication
            const userCredential = await signUpWithEmailAndPassword(email, password, username);
            const user = userCredential.user;
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                username: username,
                accountType: 'Member',
                enabledAccountModes: ['Member'],
                firstName: '',
                lastName: '',
                email: user.email,
            });
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
            // Check if the user is new, then update the document in the "users" collection with the user's information
            if (additionalUserInfo?.isNewUser && userCredential.user) {
                const usersCollectionRef = collection(db, 'users');
                const newUserData = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email as string,
                    username: userCredential.user.displayName as string,
                    firstName: userCredential.user.displayName as string,
                    lastName: userCredential.user.displayName as string,
                    accountType: 'Member',
                    enabledAccountModes: ['Member'],
                };
                await createUserDocument(usersCollectionRef, newUserData);

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
                    onIonChange={async (event) => {
                        setUsername(event.detail.value!)
                        await checkUsername(event.detail.value!);
                    }}
                />
            </IonItem>

            <IonButton
                onClick={() => handleSignup(email, password, username)}
                disabled={isUsernameTaken}
            >
                Sign Up
            </IonButton>

            {isUsernameTaken && (
                <IonText color="danger">
                    <p>Username is already taken.</p>
                </IonText>
            )}
            <IonText>
                <h2>OR</h2>
            </IonText>
            <IonButton onClick={handleGoogleSignup}>Sign Up with Google</IonButton>
            <IonItem button routerLink="/SignUp" routerDirection="none">
                <IonLabel>Create Organization for a School</IonLabel>
            </IonItem>
        </IonPage>
    );
};

export default Signup;
