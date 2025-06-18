import { type Role } from './team';
import { z } from 'zod';

export interface EmbedNote {
  id: string;
  embedId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  visibility: 'private' | 'team';
  tags?: string[];
}

export interface EmbedPermission {
  embedId: string;
  userId: string;
  role: Role;
  grantedBy: string;
  grantedAt: string;
}

export interface Embed {
  id: string;
  name: string;
  description?: string;
  teamId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    // ... other settings
  };
  permissions: EmbedPermission[];
  notes: EmbedNote[];
  status: 'active' | 'archived' | 'draft';
  lastUsed?: string;
  usage: {
    totalTokens: number;
    totalRequests: number;
    lastMonthTokens: number;
    lastMonthRequests: number;
  };
  metadata: Record<string, any>;
}

export type EmbedTheme = 'light' | 'dark' | 'system';
export type EmbedPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export const EmbedThemeSchema = z.enum(['light', 'dark', 'system']);
export const EmbedPositionSchema = z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']);

export interface ChatEmbedConfig {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  theme: EmbedTheme;
  position: EmbedPosition;
  primaryColor: string;
  welcomeMessage?: string;
  systemPrompt?: string;
  isActive: boolean;
  apiKeyId?: string;
  modelVendor: string;
  modelName: string;
  width?: number;
  height?: number;
  responsive?: boolean;
  settings: {
    allowAttachments: boolean;
    requireUserEmail: boolean;
    showBranding?: boolean;
    markdownSupport?: boolean;
    backgroundColor?: string;
    maxTokensPerMessage?: number;
    temperature?: number;
    messageHistory?: number;
    customFontFamily?: string;
    customHeaderText?: string;
    customPlaceholderText?: string;
    showTypingIndicator?: boolean;
    enableMarkdown?: boolean;
    enableCodeHighlighting?: boolean;
    enableEmoji?: boolean;
    rateLimit?: {
      maxRequestsPerHour: number;
      enabled: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
  interactionCount?: number;
}

export const ChatEmbedConfigSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  theme: EmbedThemeSchema,
  position: EmbedPositionSchema,
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  welcomeMessage: z.string().max(500).optional(),
  systemPrompt: z.string().max(2000).optional(),
  isActive: z.boolean(),
  apiKeyId: z.string().optional(),
  modelVendor: z.string().default('openai'),
  modelName: z.string().default('gpt-4'),
  width: z.number().min(200).max(1200).optional(),
  height: z.number().min(200).max(1200).optional(),
  responsive: z.boolean().default(true).optional(),
  settings: z.object({
    allowAttachments: z.boolean().default(false),
    requireUserEmail: z.boolean().default(true),
    showBranding: z.boolean().default(true),
    markdownSupport: z.boolean().optional(),
    backgroundColor: z.string().optional(),
    customCss: z.string().max(2000).optional(),
    maxTokensPerMessage: z.number().min(100).max(4000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    messageHistory: z.number().min(1).max(50).optional(),
    aiModel: z.string().optional(),
    customFontFamily: z.string().max(100).optional(),
    customHeaderText: z.string().max(100).optional(),
    customPlaceholderText: z.string().max(100).optional(),
    showTypingIndicator: z.boolean().default(true),
    enableMarkdown: z.boolean().default(true),
    enableCodeHighlighting: z.boolean().default(true),
    enableEmoji: z.boolean().default(true),
    rateLimit: z.object({
      maxRequestsPerHour: z.number().min(1).max(1000),
      enabled: z.boolean()
    }).optional()
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  interactionCount: z.number().int().optional()
});

export type CreateEmbedConfig = Omit<ChatEmbedConfig, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>; 