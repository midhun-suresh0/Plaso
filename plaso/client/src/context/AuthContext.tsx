import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tokenStorage } from '../services/tokenStorage';
import { authApi, User } from '../services/authApi';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    token: null,
  });

  const checkAuth = async () => {
    try {
      const token = await tokenStorage.getToken();
      if (!token) {
        setState({ isLoading: false, isAuthenticated: false, user: null, token: null });
        return;
      }

      // We have a token, let's verify it with the backend
      const response = await authApi.getCurrentUser();
      
      if (response.success && response.data) {
        setState({
          isLoading: false,
          isAuthenticated: true,
          user: response.data.user,
          token,
        });
      } else {
        // Token is invalid or expired
        await tokenStorage.removeToken();
        setState({ isLoading: false, isAuthenticated: false, user: null, token: null });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setState({ isLoading: false, isAuthenticated: false, user: null, token: null });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (token: string, user: User) => {
    await tokenStorage.saveToken(token);
    setState({
      isLoading: false,
      isAuthenticated: true,
      user,
      token,
    });
  };

  const logout = async () => {
    await tokenStorage.removeToken();
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
