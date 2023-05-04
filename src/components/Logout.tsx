// src/components/Logout.tsx
import { IonButton } from '@ionic/react';
import { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const Logout: React.FC = () => {
  const { logout } = useContext(AuthContext);
  const history = useHistory();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect the user to the login page or another appropriate page.
      history.push('/Login');
    } catch (error) {
      // Handle errors during logout here.
      const err = error as Error;
      console.error('Error during logout:', err.message);
    }
  };

  return <IonButton onClick={handleLogout}>Logout</IonButton>;
};

export default Logout;
