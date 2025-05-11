import type { ChatEmbedConfig } from '@/types/embed';
import type { ApiKey } from '@/types/api-key';
import Cookies from 'js-cookie';
import type { ModelInfo } from '@/types/models';
import type { AnalyticsData } from '@/types/analytics';

// Use relative URLs to leverage the nginx proxy
const API_BASE_URL = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || Cookies.get('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // Add CSRF token from cookie if present
  const xsrfToken = Cookies.get('XSRF-TOKEN');
  if (xsrfToken) {
    headers['X-XSRF-TOKEN'] = xsrfToken;
  }
  return headers;
}

export async function fetchTeamEmbeds(teamId: string): Promise<ChatEmbedConfig[]> {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/embeds`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch embed configurations');
  }

  return response.json();
}

export async function createEmbed({ teamId, data }: { teamId: string; data: Omit<ChatEmbedConfig, 'id' | 'teamId' | 'createdAt' | 'updatedAt'> }) {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/embeds`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to create embed configuration');
  }

  return response.json();
}

export async function fetchEmbed({ teamId, embedId }: { teamId: string; embedId: string }): Promise<ChatEmbedConfig> {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/embeds/${embedId}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch embed configuration');
  }

  return response.json();
}

// Public embed fetch function (for embed iframe without team context)
export async function fetchPublicEmbed({ embedId }: { embedId: string }): Promise<ChatEmbedConfig> {
  const response = await fetch(`${API_BASE_URL}/public/embeds/${embedId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch public embed configuration');
  }

  return response.json();
}

export async function fetchUserApiKeys(): Promise<ApiKey[]> {
  const response = await fetch(`${API_BASE_URL}/keys`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch API keys');
  }

  return response.json();
}

export async function fetchApiKeyWithValue(keyId: string): Promise<ApiKey & { key: string }> {
  const response = await fetch(`${API_BASE_URL}/keys/${keyId}/value`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch API key');
  }

  return response.json();
}

export async function updateEmbed({ teamId, embedId, data }: { teamId: string; embedId: string; data: Partial<ChatEmbedConfig> }) {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/embeds/${embedId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to update embed configuration');
  }

  return response.json();
}

export async function deleteEmbed({ teamId, embedId }: { teamId: string; embedId: string }): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/embeds/${embedId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    // Consider more specific error handling based on status code if needed
    throw new Error('Failed to delete embed configuration');
  }

  // No content expected on successful DELETE
  return;
}

export async function fetchAvailableModels(apiKeyId: string): Promise<ModelInfo[]> {
  if (!apiKeyId) {
    return [];
  }
  const response = await fetch(`${API_BASE_URL}/models/${apiKeyId}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    console.error('Failed to fetch models:', await response.text());
    return [
      { id: 'gpt-4', name: 'GPT-4 (Fallback)', vendor: 'openai', defaultModel: false },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Fallback)', vendor: 'openai', defaultModel: true }
    ] as ModelInfo[];
  }

  return response.json();
}

/**
 * Fetch analytics data for a specific team
 */
export async function fetchTeamAnalytics(
  teamId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  startDate?: Date | null,
  endDate?: Date | null
): Promise<AnalyticsData[]> {
  const params = new URLSearchParams();
  params.append('period', period);
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  const response = await fetch(
    `${API_BASE_URL}/analytics/teams/${teamId}?${params.toString()}`,
    {
      headers: getAuthHeaders(),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch team analytics');
  }

  return response.json();
}

/**
 * Fetch analytics data for a specific embed
 */
export async function fetchEmbedAnalytics(
  embedId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  startDate?: Date | null,
  endDate?: Date | null
): Promise<AnalyticsData[]> {
  const params = new URLSearchParams();
  params.append('period', period);
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  const response = await fetch(
    `${API_BASE_URL}/analytics/embeds/${embedId}?${params.toString()}`,
    {
      headers: getAuthHeaders(),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch embed analytics');
  }

  return response.json();
}

/**
 * Process analytics for a specific embed
 */
export async function processEmbedAnalytics(embedId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/analytics/embeds/${embedId}/process`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to process embed analytics');
  }

  return;
}