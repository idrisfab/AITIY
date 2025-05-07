'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/providers/TeamProvider';

export default function EmbedsPage() {
  const router = useRouter();
  const { currentTeam, isLoading } = useTeam();

  useEffect(() => {
    if (!isLoading && currentTeam) {
      router.replace(`/dashboard/${currentTeam.id}/embeds`);
    }
  }, [currentTeam, isLoading, router]);

  return null; // No need to render anything as we're redirecting
} 