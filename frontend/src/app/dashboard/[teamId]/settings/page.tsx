'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamSettingsPage({ params }: { params: { teamId: string } }) {
  const router = useRouter();
  
  useEffect(() => {
    // Just redirect to the main Settings page for now
    // You may want to update the main Settings page to accept a team parameter
    router.replace(`/dashboard/settings`);
  }, [router]);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Redirecting to Settings...</p>
    </div>
  );
} 