// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // API URL
  const API_URL = (() => {
    try {
      return import.meta.env.VITE_API_URL || 'http://localhost:3000';
    } catch (e) {
      return 'http://localhost:3000';
    }
  })();

  // Charger depuis localStorage au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem('7ela9_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('7ela9_user');
      }
    }
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      console.log('🔄 Vérification de session...');
      const response = await fetch(`${API_URL}/api/auth/check`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Session active:', data.user);
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('7ela9_user', JSON.stringify(data.user));
        }
      } else {
        console.log('❌ Pas de session active');
        setUser(null);
        localStorage.removeItem('7ela9_user');
      }
    } catch (error) {
      console.error('❌ Erreur vérification session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔑 Tentative de connexion...', email);
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();
      console.log('📨 Réponse login:', data);

      if (response.ok && data.user) {
        // Mettre à jour l'état local
        setUser(data.user);
        localStorage.setItem('7ela9_user', JSON.stringify(data.user));
        console.log('✅ Utilisateur connecté:', data.user);
        
        return { 
          success: true, 
          data: data.user 
        };
      } else {
        return { 
          success: false, 
          error: data.error || data.message || 'Échec de connexion' 
        };
      }
    } catch (error) {
      console.error('❌ Erreur login:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('7ela9_user');
    }
  };

  // Fonction pour rafraîchir manuellement l'état
  const refreshUser = () => {
    checkSession();
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    checkSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};