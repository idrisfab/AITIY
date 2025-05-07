import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import type { Team, TeamMember, TeamInvite, Role } from '@/types/team';

interface TeamManagementProps {
  team: Team;
  currentUserId: string;
  onUpdateTeam: (updates: Partial<Team>) => Promise<void>;
  onInviteMember: (email: string, role: Role) => Promise<void>;
  onUpdateMember: (memberId: string, updates: Partial<TeamMember>) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onCancelInvite: (inviteId: string) => Promise<void>;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  team,
  currentUserId,
  onUpdateTeam,
  onInviteMember,
  onUpdateMember,
  onRemoveMember,
  onCancelInvite,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [editingTeam, setEditingTeam] = useState(false);
  const [teamName, setTeamName] = useState(team.name);
  const [teamDescription, setTeamDescription] = useState(team.description || '');

  const currentUserRole = team.members.find(m => m.userId === currentUserId)?.role;
  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isOwner = currentUserRole === 'owner';

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await onInviteMember(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      toast.success('Invitation sent successfully');
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!teamName.trim()) return;

    try {
      await onUpdateTeam({
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      });
      setEditingTeam(false);
      toast.success('Team updated successfully');
    } catch (error) {
      toast.error('Failed to update team');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: Role) => {
    try {
      await onUpdateMember(memberId, { role: newRole });
      toast.success('Member role updated successfully');
    } catch (error) {
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await onRemoveMember(memberId);
      toast.success('Member removed successfully');
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="space-y-8">
      {/* Team Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Team Details
          </h2>
          {canManageTeam && (
            <Button
              variant="outline"
              onClick={() => setEditingTeam(!editingTeam)}
            >
              {editingTeam ? 'Cancel' : 'Edit'}
            </Button>
          )}
        </div>

        {editingTeam ? (
          <div className="space-y-4">
            <Input
              label="Team Name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
            <Input
              label="Description"
              type="text"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Optional team description"
            />
            <div className="flex justify-end">
              <Button onClick={handleUpdateTeam}>
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {team.name}
            </h3>
            {team.description && (
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {team.description}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Created {format(new Date(team.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Team Members
        </h2>

        <div className="space-y-6">
          {/* Member List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="py-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                        {member.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {canManageTeam && member.userId !== currentUserId ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as Role)}
                        className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                        disabled={!isOwner && member.role === 'owner'}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        {isOwner && <option value="owner">Owner</option>}
                      </select>
                      <Button
                        variant="ghost"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={member.role === 'owner'}
                      >
                        <svg className="h-5 w-5 text-gray-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Invite Member Form */}
          {canManageTeam && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Invite New Member
              </h3>
              <div className="flex space-x-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail.trim() || isInviting}
                >
                  {isInviting ? 'Inviting...' : 'Invite'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Invites */}
      {team.settings.allowMemberInvites && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Pending Invites
          </h2>

          <div className="space-y-4">
            {/* TODO: Add pending invites list */}
          </div>
        </div>
      )}

      {/* Team Settings */}
      {canManageTeam && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Team Settings
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Allow Member Invites
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Let team members invite new members
                </p>
              </div>
              <Switch
                checked={team.settings.allowMemberInvites}
                onCheckedChange={(checked: boolean) =>
                  onUpdateTeam({
                    settings: {
                      ...team.settings,
                      allowMemberInvites: checked,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Require Admin Approval
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Require admin approval for new member invites
                </p>
              </div>
              <Switch
                checked={team.settings.requireAdminApproval}
                onCheckedChange={(checked: boolean) =>
                  onUpdateTeam({
                    settings: {
                      ...team.settings,
                      requireAdminApproval: checked,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 