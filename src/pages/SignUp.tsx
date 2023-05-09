import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonButton, IonInput, IonItem, IonLabel, IonPage } from '@ionic/react';
import useAuth from '../useAuth';
import AccountModeSelector from '../components/AccountModeSelector';

const Signup: React.FC = () => {
    const { signUpWithEmailAndPassword } = useAuth();
    const history = useHistory();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [accountType, setAccountType] = useState<string[]>([]);

    const handleSignup = async () => {
        try {
            // Create the user in Firebase Authentication
            await signUpWithEmailAndPassword(email, password, username, accountType);

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
                <IonLabel position="floating">@Username</IonLabel>
                <IonInput
                    type="text"
                    value={username}
                    onIonChange={(event) => setUsername(event.detail.value!)}
                />
            </IonItem>

            <IonItem>
                <IonLabel position="floating">Account Type</IonLabel>
                <AccountModeSelector
                    value={accountType}
                    onAccountModeChange={(value) => setAccountType(value)}
                />
            </IonItem>

            <IonButton onClick={handleSignup}>Sign Up</IonButton>
        </IonPage>
    );
};

export default Signup;
