'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

interface EmbedContextType {
  isEmbedMode: boolean;
  isLoading: boolean;
  error: string | null;
}

const EmbedContext = createContext<EmbedContextType>({
  isEmbedMode: true,
  isLoading: false,
  error: null
});

export const useEmbed = () => useContext(EmbedContext);

// This provider completely replaces the need for TeamProvider and AuthProvider in embed mode
// It isolates the embed functionality from the main application's authentication flow
export function EmbedProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Override any auth-related hooks or context
  useEffect(() => {
    // Intercept any TeamProvider or AuthProvider errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out TeamProvider errors
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('TeamProvider') || 
           args[0].includes('AuthProvider') || 
           args[0].includes('Hydration'))) {
        // Suppress these errors in embed mode
        return;
      }
      originalConsoleError(...args);
    };
    
    return () => {
      // Restore original console.error on cleanup
      console.error = originalConsoleError;
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <EmbedContext.Provider value={{ 
        isEmbedMode: true, 
        isLoading, 
        error 
      }}>
        {children}
      </EmbedContext.Provider>
    </QueryClientProvider>
  );
}
