'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

// Helper functions for cookie management (client-side only for reading userData)
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user data is available in cookies
    const userData = getCookie('userData');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData));
        setUser(parsedUser);
      } catch {
        // If parsing fails, user is not authenticated
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  // For client-side logout, we'll need to call the server action
  const logout = async () => {
    try {
      // Call the server action for logout
      const { logout: logoutAction } = await import('@/lib/actions/auth-actions');
      await logoutAction();
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: redirect to login on error
      router.push('/login');
    }
  };

  const isAuthenticated = (): boolean => {
    return user !== null;
  };

  return {
    user,
    logout,
    isAuthenticated,
    isLoading
  };
};
