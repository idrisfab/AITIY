import api from './api';

export type VendorId = 'openai' | 'anthropic' | 'cohere' | 'gemini' | 'grok';

export interface VendorConfig {
  id: VendorId;
  name: string;
  description: string;
  keyPattern: RegExp;
  keyPrefix: string;
  docsUrl: string;
  validateKey: (key: string) => Promise<{ isValid: boolean; error?: string }>;
}

export const vendors: Record<VendorId, VendorConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'Power your chat embeds with GPT-3.5 and GPT-4 models',
    keyPattern: /^sk-[a-zA-Z0-9-]{32,}$/,
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.openai.com/account/api-keys',
    validateKey: async (key: string) => {
      try {
        const response = await api.post('/keys/validate', {
          key,
          vendor: 'openai'
        });
        return response.data;
      } catch (error: any) {
        return { 
          isValid: false, 
          error: error.response?.data?.error || error.message || 'Failed to validate API key'
        };
      }
    }
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Use Claude models for advanced language understanding',
    keyPattern: /^sk-ant-api\d{2}-[A-Za-z0-9-_]{70,}$/,
    keyPrefix: 'sk-ant-',
    docsUrl: 'https://console.anthropic.com/account/keys',
    validateKey: async (key: string) => {
      try {
        const response = await api.post('/keys/validate', {
          key,
          vendor: 'anthropic'
        });
        return response.data;
      } catch (error: any) {
        return { 
          isValid: false, 
          error: error.response?.data?.error || error.message || 'Failed to validate API key'
        };
      }
    }
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Use Google Gemini models for powerful AI capabilities',
    keyPattern: /^[A-Za-z0-9_-]{39}$/,
    keyPrefix: '',
    docsUrl: 'https://ai.google.dev/tutorials/setup',
    validateKey: async (key: string) => {
      try {
        const response = await api.post('/keys/validate', {
          key,
          vendor: 'gemini'
        });
        return response.data;
      } catch (error: any) {
        return { 
          isValid: false, 
          error: error.response?.data?.error || error.message || 'Failed to validate API key'
        };
      }
    }
  },
  grok: {
    id: 'grok',
    name: 'xAI Grok',
    description: 'Use xAI Grok models for advanced reasoning capabilities',
    keyPattern: /^grok-[A-Za-z0-9]{48}$/,
    keyPrefix: 'grok-',
    docsUrl: 'https://x.ai/',
    validateKey: async (key: string) => {
      try {
        const response = await api.post('/keys/validate', {
          key,
          vendor: 'grok'
        });
        return response.data;
      } catch (error: any) {
        return { 
          isValid: false, 
          error: error.response?.data?.error || error.message || 'Failed to validate API key'
        };
      }
    }
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    description: 'Leverage Cohere\'s language models for chat',
    keyPattern: /^[a-zA-Z0-9]{32,}$/,
    keyPrefix: '',
    docsUrl: 'https://dashboard.cohere.ai/api-keys',
    validateKey: async (key: string) => {
      // TODO: Implement Cohere key validation through backend
      return { isValid: true };
    }
  }
}; 