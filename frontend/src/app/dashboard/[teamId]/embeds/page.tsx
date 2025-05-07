'use client';

import { EmbedList } from '@/components/EmbedList';
import { CreateEmbedButton } from '@/components/CreateEmbedButton';
import { PageHeader } from '@/components/PageHeader';

export default function EmbedsPage({ params }: { params: { teamId: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Chat Embeds"
        description="Create and manage chat widgets for your websites"
        action={<CreateEmbedButton teamId={params.teamId} />}
      />
      <div className="mt-8">
        <EmbedList teamId={params.teamId} />
      </div>
    </div>
  );
} 