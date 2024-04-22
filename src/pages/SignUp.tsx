import { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonPage, IonRow, IonText, IonTitle, IonToolbar } from '@ionic/react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User } from '@firebase/auth';
import { AuthContext } from '../AuthContext';
import { personAdd } from 'ionicons/icons';



const Signup: React.FC = () => {
    const { signUpWithEmailAndPassword, signInWithGoogle, checkAndUpdateAccountModes } = useContext(AuthContext);
    const history = useHistory();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [password, setPassword] = useState('');
    const [isEmailTaken, setisEmailTaken] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const checkEmail = async (email: string) => {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setisEmailTaken(false);
        } else {
            setisEmailTaken(true);
        }
    };


    const handleSignup = async (email: string, password: string) => {
        if (isSubmitting) return;  // Early return if already submitting
        setIsSubmitting(true);
        setErrorMessage('');
        await checkEmail(email);  // Check if the email is already taken
        if (isEmailTaken) {
            setErrorMessage('Email already in use. Please login or reset your password.');
            setIsSubmitting(false);
            return;
        }

        try {
            const userCredential = await signUpWithEmailAndPassword(email, password);
            if (userCredential?.user) {
                await processUser(userCredential.user);
                history.push('/Account');
            }
        } catch (error) {
            console.error('Error signing up:', error);
            if ((error as any).code === 'auth/email-already-in-use') {
                setErrorMessage('Email already in use. Please login or reset your password.');
            } else {
                setErrorMessage('An error occurred during sign up. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleGoogleSubmit = async () => {
        try {
            const userCredential = await signInWithGoogle();
            if (userCredential?.user) {
                await processUser(userCredential.user);
            }
        } catch (error) {
            setErrorMessage('Error signing in with Google. Please try again.');
            console.error('Error during Google login:', error);
        }
    };

    const processUser = async (user: User | undefined) => {
        if (!user) return;
        await checkAndUpdateAccountModes(user.uid);
        history.push(user.displayName ? '/Account' : '/SetUsername');
    };

    return (
        <IonPage className="ion-flex-offset-app">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Sign Up</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonGrid>
                    {errorMessage && (
                        <IonText color="danger">
                            <p>{errorMessage}</p>
                        </IonText>
                    )}
                    <form onSubmit={e => {
                        e.preventDefault();
                        handleSignup(email, password);
                    }}>
                        <IonItem>
                            <IonInput
                                aria-label="email"
                                type="email"
                                value={email}
                                required={true}
                                placeholder="Email Address"
                                onIonChange={(event) => setEmail(event.detail.value!)}
                            />
                        </IonItem>

                        <IonItem>
                            <IonInput
                                aria-label="password"
                                type="password"
                                value={password}
                                required={true}
                                placeholder="Password"
                                onIonChange={(event) => setPassword(event.detail.value!)}
                            />
                        </IonItem>

                        <IonButton shape="round" type="submit" expand="block" disabled={isEmailTaken || isSubmitting}>
                            <IonIcon slot="start" icon={personAdd} />
                            Sign Up with Email
                        </IonButton>

                        {isEmailTaken && (
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
                                            Sign Up with Google
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
