import { createContext, useState, useEffect } from 'react';
import { auth } from './firebaseConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoadingAuthState(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      // The onAuthStateChanged will update the user state.
    } catch (error) {
      // Handle login errors here.
      console.error('Error during login:', error.message);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      // The onAuthStateChanged will update the user state.
    } catch (error) {
      // Handle logout errors here.
      console.error('Error during logout:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loadingAuthState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
