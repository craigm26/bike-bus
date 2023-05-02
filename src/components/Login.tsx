import React, { useState } from 'react';
import useAuth from './src/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {
    signInWithEmailAndPassword,
    signInWithGoogle,
    signInAnonymously,
  } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(email, password);
      // Redirect to the main app or show a success message
    } catch (error) {
      // Handle the error (e.g., display an error message)
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login with Email</button>
      </form>
      <button onClick={signInWithGoogle}>Login with Google</button>
      <button onClick={signInAnonymously}>Login Anonymously</button>
    </div>
  );
};

export default Login;
