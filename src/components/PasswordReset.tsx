import React, { useState } from 'react';
import { IonButton, IonText } from '@ionic/react';
import useAuth from '../useAuth';

const PasswordReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { sendResetEmail } = useAuth();

  const handlePasswordReset = async () => {
    try {
      await sendResetEmail(email);
      setMessage('Password reset email sent to ' + email);
    } catch (error) {
      if (error instanceof Error) {
        setMessage("Error sending password reset email: " + error.message);
      } else {
        setMessage("Error sending password reset email.");
      }
    }
  };

  return (
    <>
      <IonText color="primary">Forgot password? Enter your email:</IonText>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <IonButton expand="block" onClick={handlePasswordReset}>
        Reset Password
      </IonButton>
      <IonText color={message.startsWith('Error') ? 'danger' : 'success'}>
        {message}
      </IonText>
    </>
  );
};

export default PasswordReset;
