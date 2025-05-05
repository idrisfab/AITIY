"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countMessageTokens = countMessageTokens;
exports.countMessagesTokens = countMessagesTokens;
exports.estimateChatCompletionTokens = estimateChatCompletionTokens;
const gpt_tokenizer_1 = require("gpt-tokenizer");
/**
 * Count tokens in a message
 * @param message The message to count tokens for
 * @returns Number of tokens in the message
 */
function countMessageTokens(message) {
    // Format message for token counting (role + content)
    const formattedMessage = `${message.role}: ${message.content}`;
    return (0, gpt_tokenizer_1.encode)(formattedMessage).length;
}
/**
 * Count tokens in multiple messages
 * @param messages Array of messages to count tokens for
 * @returns Total number of tokens across all messages
 */
function countMessagesTokens(messages) {
    return messages.reduce((total, message) => total + countMessageTokens(message), 0);
}
/**
 * Estimate tokens for a chat completion request
 * This includes a base token count for the model plus the messages
 * @param messages Array of messages in the request
 * @returns Object containing prompt tokens, estimated completion tokens, and total
 */
function estimateChatCompletionTokens(messages) {
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
