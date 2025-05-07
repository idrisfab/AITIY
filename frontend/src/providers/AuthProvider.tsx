'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

// Define the Auth context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  logout: () => void;
}

// Create the Auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  logout: () => {},
});

// Hook to use the Auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check for authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        setIsAuthenticated(true);
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        
        // Clear any existing auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('token');
        
        // Redirect to login if on protected route and not authenticated
        const isAuthPage = 
          pathname?.startsWith('/auth') || 
          pathname === '/verify-email' || 
          pathname === '/reset-password';
          
        if (!isAuthPage && pathname !== '/') {
          // We don't redirect here - using middleware for that
          // But we could add additional auth logic if needed
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [pathname, router]);

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Cookies.remove('token');
    setIsAuthenticated(false);
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/auth/login');
  };

  // Provide the auth context values
  const value = {
    isAuthenticated,
    user,
    logout,
  };

  // Show loading state while checking auth
  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 