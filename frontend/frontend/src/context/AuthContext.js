import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { trackLogin } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(localStorage.getItem('isGuest') === 'true');
  const [role, setRole] = useState(localStorage.getItem('userRole') || 'student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
        trackLogin(currentUser.uid).catch(console.error);
        
        // Mock role fetching - in a real app, this would come from a database (Firestore)
        const savedRole = localStorage.getItem(`role_${currentUser.uid}`) || 'student';
        setRole(savedRole);
      } else {
        if (localStorage.getItem('isGuest') === 'true') {
          setIsGuest(true);
          setUser({ displayName: 'Guest User', email: 'guest@example.com' });
          setRole('student');
        } else {
          setUser(null);
          setRole('student');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
    setUser({ displayName: 'Guest User', email: 'guest@example.com' });
    setRole('student');
  };

  const logout = () => {
    setIsGuest(false);
    localStorage.removeItem('isGuest');
    localStorage.removeItem('userRole');
    setUser(null);
    return auth.signOut();
  };

  const refreshUser = () => {
    if (auth.currentUser) {
      setUser({ ...auth.currentUser });
    }
  };

  const updateRole = (newRole, uid) => {
    setRole(newRole);
    if (uid) {
      localStorage.setItem(`role_${uid}`, newRole);
    } else {
      localStorage.setItem('userRole', newRole);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, role, loginAsGuest, logout, refreshUser, updateRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
