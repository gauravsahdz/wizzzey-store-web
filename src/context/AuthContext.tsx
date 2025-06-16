"use client";

import type { User } from '@/lib/types';
import { loginUser, registerUser, fetchUserProfile } from '@/services/api';
import React, { createContext, useContext, useState, useEffect, type ReactNode, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, pass: string) => Promise<void>;
  updateUserProfileContext: (updatedUserData: User) => void; // New
  handleAuthSuccess: (newToken: string, userData?: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContent({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const LStoken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (LStoken) {
      if (!token || token !== LStoken) { 
        setToken(LStoken); 
      } else { 
        if (!user) { 
          if (!loading) { 
            setLoading(true); 
          }
          fetchUserProfile()
            .then(usr => {
              setUser(usr);
            })
            .catch(err => {
              console.error("AuthContext: Profile fetch failed on initial load/token sync", err);
              localStorage.removeItem('authToken');
              setToken(null);
              setUser(null);
            })
            .finally(() => {
              setLoading(false); 
            });
        } else { 
          if (loading) { 
            setLoading(false);
          }
        }
      }
    } else { 
      if (token || user) { 
        setToken(null);
        setUser(null);
      }
      if (loading) { 
        setLoading(false);
      }
    }
  }, [token, user, pathname, loading]); 


  const handleAuthSuccess = (newToken: string, userData?: User) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken); 

    const performRedirect = () => {
      const redirectQueryParam = searchParams.get('redirect');
      const redirectPath = redirectQueryParam || '/profile';
      router.push(redirectPath);
    };

    if (userData) {
      setUser(userData);
      setLoading(false); 
      performRedirect();
    } else {
      // User data not provided with token, must fetch profile.
      // setLoading(true) is intentionally NOT set here if it's already true from login/register call
      // to avoid flicker if profile fetch is very fast. setLoading(false) will be called in finally.
      fetchUserProfile().then(profileData => {
        setUser(profileData);
        setLoading(false); 
        performRedirect();
      }).catch(err => {
        console.error("Failed to fetch profile immediately after auth:", err);
        toast({ 
          title: "Authentication Issue", 
          description: "We couldn't retrieve your profile details. Please try logging in again.", 
          variant: "destructive" 
        });
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        setLoading(false); 
        router.push('/login');
      });
    }
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { token: newToken, user: apiUser } = await loginUser({ email, pass });
      const mappedUser = apiUser ? {
        id: apiUser._id || apiUser.id!, name: apiUser.name, email: apiUser.email, role: apiUser.role, avatarUrl: apiUser.avatarUrl,
        phone: apiUser.phone, shippingAddress: apiUser.shippingAddress, billingAddress: apiUser.billingAddress,
        createdAt: apiUser.createdAt, updatedAt: apiUser.updatedAt
      } : undefined;
      handleAuthSuccess(newToken, mappedUser);
      toast({ title: "Login Successful", description: "Welcome back!" });
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      setLoading(false);
      throw err;
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const { token: newToken, user: apiUser } = await registerUser({ name, email, pass });
       const mappedUser = apiUser ? {
        id: apiUser._id || apiUser.id!, name: apiUser.name, email: apiUser.email, role: apiUser.role, avatarUrl: apiUser.avatarUrl,
        phone: apiUser.phone, shippingAddress: apiUser.shippingAddress, billingAddress: apiUser.billingAddress,
        createdAt: apiUser.createdAt, updatedAt: apiUser.updatedAt
      } : undefined;
      handleAuthSuccess(newToken, mappedUser);
      toast({ title: "Registration Successful", description: "Welcome to Wizzzey Store!" });
    } catch (err: any) {
      console.error('Registration failed:', err);
      const displayErrorMessage = err.message || 'Registration failed. Please try again.';
      toast({ title: "Registration Failed", description: displayErrorMessage, variant: "destructive" });
      setLoading(false);
      throw err; 
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const updateUserProfileContext = (updatedUserData: User) => {
    setUser(updatedUserData);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      register,
      updateUserProfileContext,
      handleAuthSuccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <AuthContext.Provider value={{
        user: null,
        token: null,
        loading: true,
        login: async () => {},
        logout: () => {},
        register: async () => {},
        updateUserProfileContext: () => {},
        handleAuthSuccess: () => {},
      }}>
        {children}
      </AuthContext.Provider>
    }>
      <AuthContent>{children}</AuthContent>
    </Suspense>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
