import { useState } from 'react';
import { useAuth as useFirebaseAuth } from '../contexts/AuthContext';

export function useAuth() {
  const { currentUser, signup, login, logout, signInWithGoogle, isSessionExpired, getRemainingTime } = useFirebaseAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (action, ...args) => {
    setLoading(true);
    setError('');
    try {
      const result = await action(...args);
      setLoading(false);
      return result;
    } catch (error) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  const signUpWithEmail = (email, password) => 
    handleAuthAction(signup, email, password);

  const signInWithEmail = (email, password) => 
    handleAuthAction(login, email, password);

  const googleSignIn = () => 
    handleAuthAction(signInWithGoogle);

  const signOut = () => 
    handleAuthAction(logout);

  return {
    currentUser,
    signUpWithEmail,
    signInWithEmail,
    googleSignIn,
    signOut,
    error,
    loading,
    isSessionExpired,
    getRemainingTime
  };
}