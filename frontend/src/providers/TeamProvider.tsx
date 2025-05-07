'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from './AuthProvider';
import type { Team } from '@/types/team';
import Cookies from 'js-cookie';

interface TeamContextType {
  currentTeam: Team | null;
  setCurrentTeam: (team: Team | null) => void;
  teams: Team[];
  isLoading: boolean;
}

const TeamContext = createContext<TeamContextType>({
  currentTeam: null,
  setCurrentTeam: () => {},
  teams: [],
  isLoading: true,
});

export const useTeam = () => useContext(TeamContext);

async function fetchTeams(): Promise<Team[]> {
  const token = Cookies.get('token') || localStorage.getItem('token');
  console.log('Fetching teams with token:', token ? 'present' : 'missing');
  
  if (!token) {
    console.log('No token found, redirecting to login');
    throw new Error('No authentication token found');
  }

  try {
    // Use the correct API URL with the backend port (3001)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    console.log('Using API URL:', apiUrl);
    
    const response = await fetch(`${apiUrl}/teams`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Unauthorized access, redirecting to login');
        throw new Error('Unauthorized');
      }
      console.error('Failed to fetch teams:', response.status, response.statusText);
      throw new Error('Failed to fetch teams');
    }

    const data = await response.json();
    console.log('Fetched teams:', data);
    return data as Team[];
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Fetch teams
  const { data: teams = [], isLoading, error } = useQuery<Team[], Error, Team[], string[]>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    enabled: isAuthenticated,
    retry: false
  });

  // Handle authentication errors
  useEffect(() => {
    if (error?.message === 'Unauthorized' || error?.message === 'No authentication token found') {
      router.push('/auth/login');
    }
  }, [error, router]);

  // Set current team from URL or first team
  useEffect(() => {
    console.log('[TeamProvider Effect] Running', { 
      isLoading, 
      isAuthenticated, 
      pathname, 
      teamsCount: teams.length, 
      error: error?.message 
    });
    
    // Don't run logic until auth is checked, loading is done, and no errors occurred
    if (isLoading || error || !isAuthenticated) {
      console.log('[TeamProvider Effect] Skipping logic (loading/error/unauthenticated)');
      return;
    }

    // Only handle team logic if we are inside a dashboard path
    if (pathname?.startsWith('/dashboard')) {
      console.log('[TeamProvider Effect] Path is dashboard');
      const pathSegments = pathname.split('/').filter(Boolean);
      const teamIdFromUrl = pathSegments.length > 1 && pathSegments[0] === 'dashboard' ? pathSegments[1] : undefined;
      console.log(`[TeamProvider Effect] Team ID from URL: ${teamIdFromUrl}`);
      
      // Case 1: Teams have been fetched
      if (teams.length > 0) {
        console.log('[TeamProvider Effect] Teams array has items');
        const targetTeam = teams.find((t: Team) => t.id === teamIdFromUrl) || teams[0];
        console.log(`[TeamProvider Effect] Target team selected: ${targetTeam?.id} (${targetTeam?.name})`);
        
        // Update context only if the currentTeam is different
        if (currentTeam?.id !== targetTeam.id) {
          console.log(`[TeamProvider Effect] Setting current team in context to: ${targetTeam.id}`);
          setCurrentTeam(targetTeam);
        }

        // Only redirect if the path is exactly '/dashboard'
        if (pathname === '/dashboard') {
          const targetPath = `/dashboard/${teams[0].id}`;
          if (pathname !== targetPath) {
            console.warn(`[TeamProvider Effect] REDIRECTING: Path (${pathname}) needs update. Redirecting to ${targetPath}`);
            router.replace(targetPath);
          }
        }
        // No redirect for subpages
      } 
      // Case 2: No teams fetched (and not loading)
      else {
        console.log('[TeamProvider Effect] No teams available for this user.');
        if (currentTeam !== null) {
           console.log('[TeamProvider Effect] Clearing current team in context.');
           setCurrentTeam(null);
        }
        // No redirect action needed here - let the page handle the no-team state
      }
    } else {
      console.log('[TeamProvider Effect] Path is not dashboard, skipping team logic.');
    }
  }, [teams, isLoading, pathname, router, error, isAuthenticated, currentTeam]);

  return (
    <TeamContext.Provider value={{ currentTeam, setCurrentTeam, teams, isLoading }}>
      {children}
    </TeamContext.Provider>
  );
} 