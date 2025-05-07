'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { fetchTeamEmbeds, deleteEmbed } from '@/lib/api';
import type { ChatEmbedConfig } from '@/types/embed';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog"

interface EmbedListProps {
  teamId: string;
}

export function EmbedList({ teamId }: EmbedListProps) {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [embedToDelete, setEmbedToDelete] = useState<ChatEmbedConfig | null>(null);

  const { data: embeds, isLoading, error } = useQuery<ChatEmbedConfig[]>({
    queryKey: ['embeds', teamId],
    queryFn: () => fetchTeamEmbeds(teamId),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmbed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embeds', teamId] });
      setIsDeleteDialogOpen(false);
      setEmbedToDelete(null);
    },
    onError: (error) => {
      console.error("Failed to delete embed:", error);
      setIsDeleteDialogOpen(false);
      setEmbedToDelete(null);
    },
  });

  const handleDeleteClick = (embed: ChatEmbedConfig) => {
    setEmbedToDelete(embed);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (embedToDelete) {
      deleteMutation.mutate({ teamId, embedId: embedToDelete.id });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    const message = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error);
    if (message.includes('401')) {
      return (
        <Card className="p-6 text-center">
          <p className="text-destructive mb-2">You are not authorized. Please <a href="/login" className="underline text-primary">log in</a> to view your embeds.</p>
        </Card>
      );
    }
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Failed to load embed configurations</p>
      </Card>
    );
  }

  if (!embeds?.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          No chat embeds created yet. Click the button above to create your first embed.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {embeds.map((embed) => (
          <Card key={embed.id} className="p-6 hover:border-accent transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-grow">
                <h3 className="font-medium text-lg">{embed.name}</h3>
                {embed.description && (
                  <p className="text-muted-foreground text-sm">{embed.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground pt-1">
                  <span>Created {format(new Date(embed.createdAt), 'MMM d, yyyy')}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Theme: {embed.theme}</span>
                  <span className="hidden sm:inline">•</span>
                  <Badge variant={embed.isActive ? 'success' : 'secondary'}>
                    {embed.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {embed.interactionCount !== undefined && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>Interactions: {embed.interactionCount}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `/dashboard/${teamId}/embeds/${embed.id}`}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(embed)}
                  disabled={deleteMutation.isPending && embedToDelete?.id === embed.id}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleteMutation.isPending && embedToDelete?.id === embed.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the embed configuration
              <span className="font-semibold"> {embedToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete embed'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 