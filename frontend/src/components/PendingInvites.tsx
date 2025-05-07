import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import type { TeamInvite } from '@/types/team';

interface PendingInvitesProps {
  invites: TeamInvite[];
  onCancelInvite: (inviteId: string) => Promise<void>;
  onResendInvite: (inviteId: string) => Promise<void>;
}

export const PendingInvites: React.FC<PendingInvitesProps> = ({
  invites,
  onCancelInvite,
  onResendInvite,
}) => {
  const handleCancelInvite = async (inviteId: string) => {
    try {
      await onCancelInvite(inviteId);
      toast.success('Invitation cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel invitation');
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      await onResendInvite(inviteId);
      toast.success('Invitation resent successfully');
    } catch (error) {
      toast.error('Failed to resend invitation');
    }
  };

  if (invites.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500 dark:text-gray-400">
          No pending invitations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-1">
            <div className="font-medium text-gray-900 dark:text-white">
              {invite.email}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Role: {invite.role}</span>
              <span>•</span>
              <span>Expires: {format(new Date(invite.expiresAt), 'MMM d, yyyy')}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Invited by: {invite.invitedBy}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {new Date(invite.expiresAt) > new Date() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResendInvite(invite.id)}
              >
                Resend
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancelInvite(invite.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Cancel
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}; 