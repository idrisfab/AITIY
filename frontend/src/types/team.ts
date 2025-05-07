export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  joinedAt: string;
  lastActive?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  settings: {
    allowMemberInvites: boolean;
    requireAdminApproval: boolean;
    defaultRole: Role;
  };
}

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  role: Role;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export type TeamActivityAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'invited'
  | 'joined'
  | 'left';

export type TeamActivityResourceType = 
  | 'team'
  | 'member'
  | 'embed'
  | 'api_key'
  | 'invite';

export interface TeamActivityMetadata {
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  action: TeamActivityAction;
  resourceType: TeamActivityResourceType;
  resourceId: string;
  metadata?: TeamActivityMetadata;
  createdAt: string;
} 