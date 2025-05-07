'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamApiKeysPage({ params }: { params: { teamId: string } }) {
  const router = useRouter();
  
  useEffect(() => {
    // Just redirect to the main API Keys page for now
    // You may want to update the main API Keys page to accept a team parameter 
    router.replace(`/dashboard/api-keys`);
  }, [router]);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Redirecting to API Keys...</p>
    </div>
  );
} 