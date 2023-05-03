import React, { useState } from 'react';
import useAuth from '../useAuth';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonButtons,
    IonMenuButton,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { signUpWithEmailAndPassword } = useAuth();
    const history = useHistory();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            // Display an error message if passwords do not match
            return;
        }

        try {
            await signUpWithEmailAndPassword(email, password);
            // Redirect to the main app or show a success message
            history.push('/dashboard');
        } catch (error) {
            // Handle the error (e.g., display an error message)
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonText color="primary" class="BikeBusFont">
                        <h1>BikeBus</h1>
                    </IonText>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonTitle>Register</IonTitle>

                <form onSubmit={handleSubmit}>
                    <IonItem>
                        <IonLabel>Email</IonLabel>
                        <IonInput
                            type="email"
                            placeholder="Email"
                            value={email}
                            onIonChange={(e) => setEmail(e.detail.value!)}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel>Password</IonLabel>
                        <IonInput
                            type="password"
                            placeholder="Password"
                            value={password}
                            onIonChange={(e) => setPassword(e.detail.value!)}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel>Confirm Password</IonLabel>
                        <IonInput
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                        />
                    </IonItem>
                    <IonButton expand="block" type="submit">
                        Register
                    </IonButton>
                </form>
            </IonContent>
        </IonPage>
    );
};

export default Register;
