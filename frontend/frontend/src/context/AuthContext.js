import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { trackLogin } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(localStorage.getItem('isGuest') === 'true');
  const [role, setRole] = useState(localStorage.getItem('userRole') || 'student');
  const [specialization, setSpecialization] = useState(localStorage.getItem('userSpecialization') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
        trackLogin(currentUser.uid).catch(console.error);
        
        // Fetch actual role from backend database
        import('../api').then(({ getUserRole }) => {
          getUserRole(currentUser.uid).then(data => {
            setRole(data.role);
            setSpecialization(data.specialization || '');
            localStorage.setItem(`role_${currentUser.uid}`, data.role);
            localStorage.setItem(`spec_${currentUser.uid}`, data.specialization || '');
          }).catch(err => {
            console.error('Error fetching role:', err);
            const savedRole = localStorage.getItem(`role_${currentUser.uid}`) || 'student';
            const savedSpec = localStorage.getItem(`spec_${currentUser.uid}`) || '';
            setRole(savedRole);
            setSpecialization(savedSpec);
          });
        });
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

  const updateSpecializationState = (newSpec, uid) => {
    setSpecialization(newSpec);
    if (uid) {
      localStorage.setItem(`spec_${uid}`, newSpec);
    } else {
      localStorage.setItem('userSpecialization', newSpec);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, role, specialization, loading, loginAsGuest, logout, refreshUser, updateRole, updateSpecializationState }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
