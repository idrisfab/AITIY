'use client';

import { ChatWidget } from '@/components/ChatWidget';
import { fetchPublicEmbed } from '@/lib/api';
import { useState, useEffect } from 'react';
import type { ChatEmbedConfig } from '@/types/embed';

interface EmbedPageProps {
  params: {
    embedId: string;
  };
}

export default function EmbedPage({ params }: EmbedPageProps) {
  const [embed, setEmbed] = useState<ChatEmbedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEmbed() {
      try {
        const embedData = await fetchPublicEmbed({ embedId: params.embedId });
        setEmbed(embedData);
        // Update document title dynamically
        document.title = `Chat Widget | ${embedData.name || 'AITIY'}`;
      } catch (err) {
        console.error('Error loading embed:', err);
        setError('Failed to load chat widget. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadEmbed();
  }, [params.embedId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat widget...</p>
        </div>
      </div>
    );
  }

  if (error || !embed) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-destructive mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Widget Error</h2>
          <p className="text-muted-foreground mb-4">{error || 'Unable to load the chat widget.'}</p>
        </div>
      </div>
    );
  }

  // Check if we're in an iframe to apply different styling
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div className={`${isInIframe ? 'h-full' : 'h-screen'} bg-background`}>
      <ChatWidget
        embed={embed}
        mode="embed"
        useRealApi={!!embed.apiKeyId} // Enable real API if we have an API key ID
        apiKey={embed.apiKeyId} // Pass the API key ID to the ChatWidget
      />
    </div>
  );
} 