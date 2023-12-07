import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonButton, IonCol, IonContent, IonGrid, IonInput, IonItem, IonLabel, IonPage, IonRow, IonText } from '@ionic/react';
import useAuth from '../useAuth';
import './Signup.css';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { User } from '@firebase/auth';


const Signup: React.FC = () => {
    const { signUpWithEmailAndPassword } = useAuth();
    const history = useHistory();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isUsernameTaken, setIsUsernameTaken] = useState(false);
    const [redirectToMap, setRedirectToMap] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const {
        signInWithEmailAndPassword,
        signInWithGoogle,
        signInWithGoogleNative,
        signInAnonymously,
        checkAndUpdateAccountModes,
    } = useAuth();

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

    const handleSignup = async (email: string, password: string, username: string, firstName: string, lastName: string) => {
        try {
            // Create the user in Firebase Authentication
            console.log('starting signUpWithEmailAndPassword');
            console.log('email', email);
            console.log('password', password);
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

    const handleGoogleSubmit = async () => {
        try {
    
          const isMobile = navigator.userAgent.match(/iPhone|iPad|iPod|Android/i);
          if (isMobile) {
            console.log('starting signInWithGoogleNative');
            const userCredential = await signInWithGoogleNative();
            console.log('userCredential', userCredential);
            console.log('starting processUser');
            // await processUser(userCredential);
          } else {
            const userCredential = await signInWithGoogle();
            await processUser(userCredential?.user);
          }
        } catch (error) {
    
        } finally {
    
        }
      };
    
      const processUser = async (user: User | undefined) => {
        if (user) {
          await checkAndUpdateAccountModes(user.uid);
          const username = user.displayName;
          if (username) {
            history.push('/Map');
          } else {
            history.push('/SetUsername');
          }
        }
      };

    useEffect(() => {
        if (redirectToMap) {
            history.push('/Map');
        }
    }, [redirectToMap, history]);


    return (

        <IonPage className="ion-flex-offset-app">
            <IonContent fullscreen>
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <IonText>
                                <h1>Sign Up</h1>
                            </IonText>
                        </IonCol>
                    </IonRow>
                    <form onSubmit={e => {
                        e.preventDefault();
                        handleSignup(email, password, username, firstName, lastName);
                    }}>
                        <IonItem>
                            <IonLabel>Email</IonLabel>
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

                        <IonButton type="submit" disabled={isUsernameTaken}>
                            Sign Up with Email
                        </IonButton>

                        {isUsernameTaken && (
                            <IonText color="danger">
                                <p>Username is already taken.</p>
                            </IonText>
                        )}
                        <IonRow>
                            <IonCol>
                                <IonText className="use-google">
                                    or
                                </IonText>
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <IonText className="use-google">
                                    <p>
                                        <IonButton
                                            onClick={handleGoogleSubmit}
                                        >
                                            Create Account with Google
                                        </IonButton>
                                    </p>
                                </IonText>
                            </IonCol>
                        </IonRow>
                    </form>
                </IonGrid>

            </IonContent>
        </IonPage>
    );
};

export default Signup;
