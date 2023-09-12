import {
    IonContent,
    IonPage,
    IonList,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonLabel,
    IonItem
} from '@ionic/react';
import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <IonPage className="ion-flex-offset-app">
            <IonContent fullscreen>
                <IonCard className="ion-justify-content-center">
                    <IonCardHeader>
                        <IonCardTitle>Privacy Policy</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonList>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">
                                    <strong>Introduction</strong>
                                    <p>Welcome to BikeBus. Your privacy is of utmost importance to us. This Privacy Policy outlines the types of data we collect from you and how we use it.</p>
                                </IonLabel>
                            </IonItem>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">
                                    <strong>Data Collection</strong>
                                    <p>We collect the following types of data for the specified purposes:</p>
                                    <ul>
                                        <li>Email Address: For account creation and communication.</li>
                                        <li>Location Data: To provide location-based services.</li>
                                        <li>User Behavior: To improve app functionality and user experience.</li>
                                    </ul>
                                </IonLabel>
                            </IonItem>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">
                                    <strong>Data Security</strong>
                                    <p>Your data's security is our top priority. All user data is encrypted during transit and securely stored in our databases.</p>
                                </IonLabel>
                            </IonItem>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">
                                    <strong>Third-Party Services</strong>
                                    <p>We may use third-party services for analytics and advertising. We ensure that these services are compliant with data protection laws and this Privacy Policy.</p>
                                </IonLabel>
                            </IonItem>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">
                                    <strong>Contact Information</strong>
                                    <p>For any data-related queries or concerns, please reach out to Craig at craigm26@gmail.com.</p>
                                </IonLabel>
                            </IonItem>
                        </IonList>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default PrivacyPolicy;
