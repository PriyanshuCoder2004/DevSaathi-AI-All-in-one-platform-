import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signIn, 
  signUp, 
  confirmSignUp, 
  signOut, 
  fetchAuthSession, 
  getCurrentUser,
  resetPassword as amplifyResetPassword,
  confirmResetPassword,
  fetchUserAttributes,
  resendSignUpCode,
  type SignInOutput,
  type SignUpOutput
} from 'aws-amplify/auth';
import type { User } from '../types';
import { ROUTES } from '../constants/routes';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialLoading: boolean;
  login: (email: string, password: string) => Promise<SignInOutput>;
  register: (name: string, email: string, password: string) => Promise<SignUpOutput>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('devsaathi_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const authUser = await getCurrentUser();
      if (authUser) {
        let attributes;
        try {
          attributes = await fetchUserAttributes();
        } catch (e) {
          console.warn('Could not fetch user attributes, using partial data', e);
          attributes = { email: '', name: 'User' };
        }
        await fetchAuthSession();
        
        let profileMeta: any = {};
        try {
          const api = (await import('../lib/api')).default;
          profileMeta = await api.get('/user/profile');
        } catch (e) {
          console.warn('Failed to fetch profile metadata', e);
        }
        
        const userData: User = {
          id: authUser.userId,
          email: attributes.email || '',
          name: attributes.name || attributes['custom:fullname'] || attributes.email?.split('@')[0] || 'User',
          isVerified: true,
          plan: 'free',
          language: profileMeta.language || 'en',
          level: profileMeta.level || 'beginner',
          avatar: profileMeta.avatar || null,
          notifications: profileMeta.notifications || { email: true, push: false },
          createdAt: new Date().toISOString(),
          streak: 0,
          lastActive: new Date().toISOString()
        };
        setUser(userData);
        localStorage.setItem('devsaathi_user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('devsaathi_user');
      }
    } catch (error) {
      console.error('checkAuth failed:', error);
      setUser(null);
      localStorage.removeItem('devsaathi_user');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const output = await signIn({ username: email, password });
      
      if (output.isSignedIn) {
        await checkAuth();
      }
      return output;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const output = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name
          }
        }
      });
      return output;
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code
      });
    } catch (err) {
      console.error('Verification failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      await resendSignUpCode({ username: email });
    } catch (err) {
      console.error('Resend code failed:', err);
      throw err;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await amplifyResetPassword({ username: email });
    } catch (err) {
      console.error('Forgot password failed:', err);
      throw err;
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword
      });
    } catch (err) {
      console.error('Reset password failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      localStorage.removeItem('devsaathi_user');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updates };
      setUser(newUser);
      localStorage.setItem('devsaathi_user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      isInitialLoading,
      login, 
      register, 
      verifyEmail, 
      resendVerificationCode,
      forgotPassword,
      resetPassword,
      logout,
      updateUser
    }}>
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
