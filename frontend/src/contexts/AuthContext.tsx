import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User, SessionData } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signupStep1: (data: any) => Promise<void>;
  signupStep2: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkSecurityQuestions: () => Promise<boolean>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on app load
    const currentUser = apiService.getCurrentUser();
    if (currentUser && apiService.isAuthenticated()) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.login(username, password);
      setUser(response.user);
      
      if (response.requires_completion && response.next_step) {
        // Handle incomplete signup flow
        console.log(`User needs to complete signup step ${response.next_step}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signupStep1 = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.signupStep1(data);
      
      // Set temporary user data for step 2
      setUser({
        id: response.user_id,
        username: response.username,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        is_complete: false,
        signup_step: 1
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup step 1 failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signupStep2 = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await apiService.signupStep2(data);
      
      // Update user completion status
      if (user) {
        setUser({
          ...user,
          is_complete: true,
          signup_step: 2
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup step 2 failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const response = await apiService.getProfile();
        setUser(response.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // If profile fetch fails, user might be logged out
      setUser(null);
      apiService.clearUserSession();
    }
  };

  const checkSecurityQuestions = async (): Promise<boolean> => {
    try {
      const questions = await apiService.getSecurityQuestions();
      return questions.length >= 5; // User has completed security questions
    } catch (err) {
      console.error('Failed to check security questions:', err);
      return false;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && apiService.isAuthenticated(),
    isLoading,
    login,
    logout,
    signupStep1,
    signupStep2,
    refreshUser,
    checkSecurityQuestions,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
