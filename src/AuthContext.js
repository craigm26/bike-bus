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

  return (
    <AuthContext.Provider value={{ user, loadingAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};
