import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { authAPI } from '../lib/api';
import { User, AuthState } from '../lib/types';

interface AuthContextType extends AuthState {
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  verifyPinAndUnlock: (pin: string) => Promise<boolean>;
  lockApp: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Setup auto-lock system variables mimicking the Web equivalent
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('kb_token');
        const storedUser = await AsyncStorage.getItem('kb_user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          const parsedUser = JSON.parse(storedUser);
          
          // Lock state if the profile has any positive integer timeout or requires it implicitly.
          setIsUnlocked(false); 
        }
      } catch (err) {
        console.error('Failed restoring auth state:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // Handle Mobile Backgrounding / Auto-Lock Native Hooking
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        const timeout = user?.autoLockTime;
        if (timeout && timeout > 0) {
           setIsUnlocked(false);
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => { subscription.remove(); };
  }, [user?.autoLockTime]);


  const login = async (userData: User, jwt: string) => {
    await AsyncStorage.setItem('kb_token', jwt);
    await AsyncStorage.setItem('kb_user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    setIsUnlocked(false); // Force PIN gate directly after login to match web feature parity
    setLastActivity(Date.now());
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['kb_token', 'kb_user']);
    setToken(null);
    setUser(null);
    setIsUnlocked(false);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    await AsyncStorage.setItem('kb_user', JSON.stringify(updated));
  };

  const verifyPinAndUnlock = async (pin: string) => {
    try {
      const res = await authAPI.verifyPin(pin);
      if (res.data.success) {
        setIsUnlocked(true);
        setLastActivity(Date.now());
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const lockApp = () => setIsUnlocked(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isUnlocked,
        login,
        logout,
        updateUser,
        verifyPinAndUnlock,
        lockApp,
        isLoading
      }}
    >
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
