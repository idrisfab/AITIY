import Cookies from 'js-cookie';

// Use relative URLs to leverage the nginx proxy
const API_BASE_URL = '/api';

function getHeaders() {
  const token = typeof window !== 'undefined' ? 
    localStorage.getItem('token') || Cookies.get('token') : '';
  
  // Get CSRF token from cookies
  const csrfToken = typeof window !== 'undefined' ? 
    Cookies.get('XSRF-TOKEN') : '';
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionRequest {
  apiKeyId: string;
  modelName: string;
  messages: Message[];
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

type ModelVendor = 'openai' | 'anthropic' | 'gemini' | 'grok';

/**
 * Sends a chat completion request to the OpenAI API through our backend proxy
 */
export async function sendChatCompletionRequest({
  apiKeyId,
  modelName,
  messages,
  stream = false,
}: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/chat-completion`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      apiKeyId,
      model: modelName,
      messages,
      stream,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to get chat completion: ${response.status}`);
  }

  return response.json();
}

/**
 * Direct call to AI API (for testing in preview)
 * Routes all requests through the backend proxy to avoid CORS issues
 */
export async function sendDirectChatCompletionRequest({
  apiKey,
  modelName,
  messages,
  vendor = 'openai',
  embedId = '',
}: {
  apiKey?: string; // Make apiKey optional
  modelName: string;
  messages: Message[];
  vendor?: ModelVendor;
  embedId?: string;
}): Promise<ChatCompletionResponse> {
  // For public embeds, use a different endpoint that doesn't require authentication
  const isPublicEmbed = embedId && embedId.length > 0;
  const endpoint = isPublicEmbed ? `/public/embeds/${embedId}/chat` : '/proxy/chat-completion';
  
  console.log(`Using API endpoint: ${API_BASE_URL}${endpoint}`);
  console.log('Is public embed?', isPublicEmbed);
  
  // Headers depend on whether this is a public embed or not
  const headers = isPublicEmbed ? 
    { 'Content-Type': 'application/json' } : 
    getHeaders();
  
  // Format the request body based on the endpoint
  const requestBody = isPublicEmbed ? 
    {
      messages, // Only send the messages array for public embed endpoint
      sessionId: 'session_' + Date.now() // Generate a session ID for tracking
    } : 
    {
      ...(apiKey ? { apiKey } : {}), // Only include apiKey if it's provided
      modelName,
      messages,
      vendor,
      temperature: 0.7,
      maxTokens: vendor === 'anthropic' ? 4000 : vendor === 'gemini' ? 2048 : 1024,
    };
  
  console.log('Sending request with body:', JSON.stringify(requestBody).substring(0, 200) + '...');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    credentials: 'include', // Important for CSRF cookies
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  return response.json();
} 