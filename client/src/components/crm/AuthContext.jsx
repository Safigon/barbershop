import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('crm_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm_user')); } catch { return null; }
  });

  function login(token, user) {
    localStorage.setItem('crm_token', token);
    localStorage.setItem('crm_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
