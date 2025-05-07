import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
}: {
  apiKey: string;
  modelName: string;
  messages: Message[];
  vendor?: ModelVendor;
}): Promise<ChatCompletionResponse> {
  // Instead of making direct API calls, use our backend proxy
  const response = await fetch(`${API_BASE_URL}/proxy/chat-completion`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include', // Important for CSRF cookies
    body: JSON.stringify({
      apiKey,
      modelName,
      messages,
      vendor,
      temperature: 0.7,
      maxTokens: vendor === 'anthropic' ? 4000 : vendor === 'gemini' ? 2048 : 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  return response.json();
} 