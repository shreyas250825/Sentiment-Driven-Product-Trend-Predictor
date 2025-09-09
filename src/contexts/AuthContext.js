import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginTime, setLoginTime] = useState(null); // timestamp when user logged in

  // Signup
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
  function logout() {
    setLoginTime(null);
    return signOut(auth);
  }

  // Google Login
  function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
  }

  // Returns milliseconds since login
  function getElapsedTime() {
    if (!loginTime) return 0;
    return Date.now() - loginTime;
  }

  // Returns remaining time until logout (here, we just track until manual logout)
  function getRemainingTime() {
    return loginTime ? Date.now() - loginTime : 0;
  }

  // Check if session is "expired" (optional, can be based on timeout)
  function isSessionExpired() {
    return false; // since we track until logout, it never auto-expires
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setLoginTime(Date.now()); // mark login timestamp

        // Get Firebase ID token and store in localStorage
        try {
          const idToken = await user.getIdToken();
          localStorage.setItem('token', idToken);
        } catch (error) {
          console.error('Error getting ID token:', error);
        }
      } else {
        setCurrentUser(null);
        setLoginTime(null);
        // Remove token from localStorage on logout
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    signInWithGoogle,
    getElapsedTime,
    getRemainingTime,
    isSessionExpired
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
