import { encode } from 'gpt-tokenizer';

interface Message {
  role: string;
  content: string;
}

/**
 * Count tokens in a message
 * @param message The message to count tokens for
 * @returns Number of tokens in the message
 */
export function countMessageTokens(message: Message): number {
  // Format message for token counting (role + content)
  const formattedMessage = `${message.role}: ${message.content}`;
  return encode(formattedMessage).length;
}

/**
 * Count tokens in multiple messages
 * @param messages Array of messages to count tokens for
 * @returns Total number of tokens across all messages
 */
export function countMessagesTokens(messages: Message[]): number {
  return messages.reduce((total, message) => total + countMessageTokens(message), 0);
}

/**
 * Estimate tokens for a chat completion request
 * This includes a base token count for the model plus the messages
 * @param messages Array of messages in the request
 * @returns Object containing prompt tokens, estimated completion tokens, and total
 */
export function estimateChatCompletionTokens(messages: Message[]): { 
  promptTokens: number; 
  completionTokens: number; 
  totalTokens: number;
} {
  const promptTokens = countMessagesTokens(messages);
  
  // Estimate completion tokens (typically 15-20% of prompt tokens, min 100)
  // This is a rough estimate - actual usage will vary
  const completionTokens = Math.max(100, Math.ceil(promptTokens * 0.2));
  
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens
  };
} 