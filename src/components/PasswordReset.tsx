import React, { useState } from 'react';
import { IonButton, IonText } from '@ionic/react';
import useAuth from '../useAuth';

interface PasswordResetProps {
  email: string;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ email }) => {
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
      <IonText>Forgot password?</IonText>
      <IonButton onClick={handlePasswordReset}>
        Reset Password
      </IonButton>
      <IonText color={message.startsWith('Error') ? 'danger' : 'success'}>
        {message}
      </IonText>
    </>
  );
};

export default PasswordReset;
