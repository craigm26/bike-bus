import React, { useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonInput,
    IonButton,
    IonLabel
} from '@ionic/react';

const InviteUser: React.FC = () => {
    const [email, setEmail] = useState<string>('');

    const handleInvite = () => {
        sendInvite(email);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Invite User</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLabel>Enter User's Email:</IonLabel>
                <IonInput value={email} placeholder="Email" onIonChange={e => setEmail(e.detail.value!)}></IonInput>
                <IonButton expand="full" onClick={handleInvite}>Send Invite</IonButton>
            </IonContent>
        </IonPage>
    );
};

export default InviteUser;

async function sendInvite(email: string) {
    // This is where you would handle the actual sending of the invite.
    // For example, you might make a request to your server here, or call a Firebase function.

    // Below is a simplified example that just logs the email to the console.
    console.log(`Invitation sent to ${email}!`);
}
