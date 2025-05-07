'use client'; // Add this directive

import { redirect } from 'next/navigation';
import { useTeam } from '@/providers/TeamProvider'; // Import useTeam to get context
import { PageHeader } from '@/components/PageHeader'; // Import PageHeader
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import { fetchTeamEmbeds } from '@/lib/api'; // Import fetch function
import type { ChatEmbedConfig } from '@/types/embed'; // Import type
import { Card } from '@/components/ui/Card'; // Import Card for styling
import { Button } from '@/components/ui/Button'; // Import Button
import Link from 'next/link'; // Import Link

export default function TeamDashboardPage({ params }: { params: { teamId: string } }) {
  const { currentTeam } = useTeam(); // Get team context
  
  // Fetch embeds using useQuery
  const { data: embeds, isLoading, error } = useQuery<ChatEmbedConfig[]>({
    queryKey: ['embeds', params.teamId],
    queryFn: () => fetchTeamEmbeds(params.teamId),
  });
  
  // Optional: Redirect if team context doesn't match params, though TeamProvider should handle this
  // if (currentTeam && currentTeam.id !== params.teamId) {
  //   redirect(`/dashboard/${currentTeam.id}`);
  // }
  
  // redirect(`/dashboard/${params.teamId}/embeds`); // <-- Comment out or remove this line
  
  const renderEmbedSummary = () => {
    if (isLoading) {
      return (
        <Card className="p-6 mt-6">
          <p className="text-muted-foreground">Loading embed summary...</p>
        </Card>
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error) {
       // Handle specific unauthorized error
      if (errorMessage.includes('401')) {
        return (
          <Card className="p-6 mt-6 text-center">
            <p className="text-destructive mb-2">You are not authorized. Please <Link href="/auth/login" className="underline text-primary">log in</Link> to view the summary.</p>
          </Card>
        );
      }
      return (
        <Card className="p-6 mt-6 text-center">
          <p className="text-destructive">Failed to load embed summary.</p>
        </Card>
      );
    }

    if (!embeds || embeds.length === 0) {
      return (
        <Card className="p-6 mt-6 text-center">
          <p className="text-muted-foreground mb-4">No chat embeds created yet.</p>
          <Button>
            <Link href={`/dashboard/${params.teamId}/embeds`}>Create Embed</Link>
          </Button>
        </Card>
      );
    }

    const activeEmbeds = embeds.filter(e => e.isActive).length;
    return (
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold mb-3">Embed Summary</h2>
        <p className="text-muted-foreground">
          Total Embeds: {embeds.length}
        </p>
        <p className="text-muted-foreground mb-4">
          Active Embeds: {activeEmbeds}
        </p>
        <Button variant="outline">
          <Link href={`/dashboard/${params.teamId}/embeds`}>Manage Embeds</Link>
        </Button>
      </Card>
    );
  };

  // Return actual content for the team dashboard
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={currentTeam ? `${currentTeam.name} Dashboard` : "Team Dashboard"}
        description={`Overview for team ${currentTeam?.name || params.teamId}`}
      />
      <div className="mt-8">
        <p className="text-gray-700 dark:text-gray-300">
          Welcome to the dashboard for team: {currentTeam?.name || params.teamId}.
        </p>
        {/* Embed Summary Section */}
        {renderEmbedSummary()}
        {/* TODO: Add team-specific stats, quick actions, etc. here */}
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          - idro.co.uk
        </p>
      </div>
    </div>
  );
} 