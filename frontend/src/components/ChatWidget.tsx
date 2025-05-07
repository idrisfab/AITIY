import { useState, useRef, useEffect } from 'react';
import { sendDirectChatCompletionRequest } from '@/services/openai';
import { toast } from 'react-hot-toast';
import type { ChatEmbedConfig } from '@/types/embed';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface ChatWidgetProps {
  embed: ChatEmbedConfig;
  mode?: 'embed' | 'preview';
  apiKey?: string;
  useRealApi?: boolean;
}

export function ChatWidget({
  embed,
  mode = 'embed',
  apiKey,
  useRealApi = false
}: ChatWidgetProps) {
  // Function to format chat messages as plain text
  const formatChatAsText = () => {
    return messages.map(msg => {
      const role = msg.role === 'assistant' ? 'AI' : 'You';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
  };
  
  // Function to download chat as text file
  const downloadChatAsText = () => {
    const text = formatChatAsText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Chat downloaded successfully');
  };
  
  // Function to copy chat to clipboard
  const copyChatToClipboard = () => {
    const text = formatChatAsText();
    
    // Check if we're in an iframe
    const isInIframe = window.self !== window.top;
    
    if (isInIframe) {
      // Use fallback method for iframe environments
      try {
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed'; // Prevent scrolling to bottom
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        // Execute the copy command
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          toast.success('Chat copied to clipboard');
        } else {
          toast.error('Failed to copy to clipboard');
        }
      } catch (err) {
        console.error('Failed to copy chat to clipboard:', err);
        toast.error('Failed to copy to clipboard');
      }
    } else {
      // Use modern Clipboard API when not in an iframe
      navigator.clipboard.writeText(text)
        .then(() => toast.success('Chat copied to clipboard'))
        .catch(err => {
          console.error('Failed to copy chat to clipboard:', err);
          toast.error('Failed to copy to clipboard');
        });
    }
  };
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: embed.welcomeMessage || '👋 Hi! How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Extract properties from embed config
  const { 
    theme = 'light',
    position = 'bottom-right',
    primaryColor = '#000000',
    systemPrompt = '',
    settings = {} as ChatEmbedConfig['settings'],
    id: embedId = '',
    modelVendor = 'openai'
  } = embed;
  
  const customHeaderText = settings.customHeaderText || 'Chat with us';
  const customPlaceholderText = settings.customPlaceholderText || 'Type your message...';
  const welcomeMessage = embed.welcomeMessage || '👋 Hi! How can I help you today?';
  const modelName = embed.modelName || 'gpt-3.5-turbo';
  const storageKey = `attiy-chat-history-${embedId}`;
  
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Load messages from localStorage when component initializes
  useEffect(() => {
    if (mode === 'embed' && typeof window !== 'undefined') {
      try {
        const savedMessages = localStorage.getItem(storageKey);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages) as Message[];
          
          // Convert string timestamps back to Date objects
          const processedMessages = parsedMessages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
          }));
          
          // Only use saved messages if they exist and there's more than just the welcome message
          if (processedMessages.length > 1) {
            setMessages(processedMessages);
          }
        }
      } catch (error) {
        console.error('Error loading chat history from localStorage:', error);
      }
    }
  }, [mode, storageKey]);
  
  // Save messages to localStorage when they change
  useEffect(() => {
    if (mode === 'embed' && typeof window !== 'undefined' && messages.length > 0) {
      try {
        // Limit number of messages to store
        const maxMessageHistory = settings.messageHistory || 50; // Default to 50 if not specified
        let messagesToStore = [...messages];
        
        // If we exceed the limit, trim from the beginning but keep the welcome message
        if (messagesToStore.length > maxMessageHistory) {
          const welcomeMessage = messagesToStore[0].role === 'assistant' ? [messagesToStore[0]] : [];
          const recentMessages = messagesToStore.slice(-(maxMessageHistory - welcomeMessage.length));
          messagesToStore = [...welcomeMessage, ...recentMessages];
        }
        
        localStorage.setItem(storageKey, JSON.stringify(messagesToStore));
      } catch (error) {
        console.error('Error saving chat history to localStorage:', error);
      }
    }
  }, [messages, mode, storageKey, settings.messageHistory]);
  
  // Reset welcome message when it changes in props
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ 
        role: 'assistant', 
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [welcomeMessage]);
  
  // Auto-focus the input field when the widget loads
  useEffect(() => {
    if (inputRef.current && mode === 'embed') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [mode]);
  
  // Notify parent window when a new message arrives
  useEffect(() => {
    if (mode === 'embed' && messages.length > 1) {
      // Get the latest message
      const latestMessage = messages[messages.length - 1];
      
      // If it's from the assistant, notify the parent window
      if (latestMessage.role === 'assistant') {
        try {
          // Notify parent window of new message for badge display
          if (window.parent !== window) {
            window.parent.postMessage(
              { type: 'attiy:new-message' }, 
              '*'
            );
          }
        } catch (error) {
          console.error('Error sending message to parent:', error);
        }
      }
    }
  }, [messages, mode]);
  
  // Intelligent scroll behavior
  useEffect(() => {
    if (!messageContainerRef.current || !messagesEndRef.current) return;
    
    // Don't auto-scroll if user is actively scrolling
    if (isUserScrolling) return;
    
    const container = messageContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // Only auto-scroll if:
    // 1. User preference allows it (shouldAutoScroll is true)
    // 2. User is already near the bottom OR this is a user-sent message (last message is from user)
    // 3. A new message was added or typing indicator changed
    const isUserMessage = messages.length > 0 && messages[messages.length - 1].role === 'user';
    
    if ((shouldAutoScroll && (isNearBottom || isUserMessage)) || isSending) {
      // Delay scrolling slightly to ensure DOM has updated
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages, isTyping, shouldAutoScroll, isUserScrolling, isSending]);
  
  // Auto-grow textarea based on content
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };
  
  // Clear chat history
  const clearChatHistory = () => {
    // Keep only the welcome message
    const welcomeMsg = { 
      role: 'assistant' as const, 
      content: welcomeMessage,
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    
    toast.success('Chat history cleared');
  };
  
  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    
    // Add user message
    const userMessage: Message = { 
      role: 'user', 
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    // Force enable auto-scrolling when user sends a message
    setShouldAutoScroll(true);
    setIsUserScrolling(false);
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    // Start typing indicator
    setIsTyping(true);
    
    try {
      if (useRealApi && apiKey) {
        // Build conversation history with system prompt
        const conversationHistory: Message[] = [];
        
        // Add system prompt if available
        if (systemPrompt) {
          conversationHistory.push({ role: 'system', content: systemPrompt });
        }
        
        // Add message history (excluding welcome message if it's the only one)
        const chatHistory = messages.length === 1 && messages[0].content === welcomeMessage 
          ? [] 
          : messages;
          
        conversationHistory.push(...chatHistory, userMessage);
        
        // Make API call using the embed's model
        const response = await sendDirectChatCompletionRequest({
          apiKey,
          modelName,
          messages: conversationHistory.map(({ role, content }) => ({ role, content })),
          vendor: modelVendor as any
        });
        
        // Extract assistant's response
        if (response.choices && response.choices.length > 0) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: response.choices[0].message.content,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // Fallback if response format is unexpected
          throw new Error('Unexpected response format from API');
        }
      } else {
        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let response = '';
        
        // Generate a contextual response considering the system prompt
        const userText = userMessage.content.toLowerCase();
        
        // Check for system prompt context first
        if (systemPrompt.toLowerCase().includes('technical support') && 
           (userText.includes('error') || userText.includes('problem') || userText.includes('issue'))) {
          response = 'I see you\'re having a technical issue. Could you please provide more details about what you\'re experiencing?';
        } else if (systemPrompt.toLowerCase().includes('sales') && 
                  (userText.includes('price') || userText.includes('cost') || userText.includes('buy'))) {
          response = 'Thank you for your interest in our products! I\'d be happy to provide pricing information or connect you with our sales team.';
        } else if (systemPrompt.toLowerCase().includes('friendly') || systemPrompt.toLowerCase().includes('casual')) {
          // More casual tone for friendly prompts
          if (userText.includes('hello') || userText.includes('hi') || userText.includes('hey')) {
            response = 'Hey there! How can I help you today? 😊';
          } else {
            const casualResponses = [
              'Great question! Let me help with that.',
              'I\'d be happy to help you with that!',
              'Sure thing! Here\'s what I can tell you...',
              'Absolutely! I can definitely help with that.',
              'Great point! Let me share some thoughts on that.'
            ];
            response = casualResponses[Math.floor(Math.random() * casualResponses.length)];
          }
        } else {
          // Default responses if no specific system prompt match
          if (userText.includes('hello') || userText.includes('hi') || userText.includes('hey')) {
            response = 'Hello there! How can I assist you today?';
          } else if (userText.includes('help')) {
            response = 'I\'d be happy to help! What do you need assistance with?';
          } else if (userText.includes('thank')) {
            response = 'You\'re welcome! Is there anything else I can help with?';
          } else if (userText.includes('bye') || userText.includes('goodbye')) {
            response = 'Goodbye! Feel free to reach out if you have more questions.';
          } else if (userText.includes('what') && userText.includes('do')) {
            response = 'I\'m an AI assistant designed to provide helpful information and answer your questions.';
          } else if (userText.includes('who') && userText.includes('you')) {
            response = 'I\'m an AI assistant created to help answer your questions and provide assistance.';
          } else {
            // Fallback responses
            const fallbacks = [
              'That\'s an interesting question. Could you provide more details?',
              'I understand what you\'re asking. Let me think about that...',
              'Thanks for your message. I\'d be happy to help with that.',
              'I see what you mean. Could you elaborate a bit more?',
              'I\'m here to help with questions like that. What specific information are you looking for?'
            ];
            response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
          }
        }
        
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'I apologize, but I encountered an error processing your request. Please try again or check your API configuration.',
          timestamp: new Date()
        }
      ]);
      
      // Show error notification
      toast.error('Error connecting to AI service');
    } finally {
      setIsTyping(false);
      setIsSending(false);
      
      // Focus on input after response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight(e.target);
  };
  
  // Format timestamp if needed
  const formatTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle scroll events to determine if user is manually scrolling
  const handleScroll = () => {
    if (!messageContainerRef.current) return;
    
    // Mark that user is actively scrolling
    setIsUserScrolling(true);
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set a timeout to mark scrolling as done after 300ms of inactivity
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
      
      // Now check if we're at the bottom and update shouldAutoScroll
      if (messageContainerRef.current) {
        const container = messageContainerRef.current;
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 20;
        setShouldAutoScroll(isAtBottom);
      }
    }, 300);
  };

  return (
    <div className={`flex flex-col rounded-lg border shadow-lg h-full ${isDark ? 'dark bg-gray-900' : 'bg-white'} overflow-hidden`}>
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-t-lg p-4"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center">
          <span className="text-white font-medium">{customHeaderText}</span>
          {isTyping && (
            <span className="text-white text-xs ml-2 opacity-70">typing...</span>
          )}
        </div>
        {mode === 'embed' && (
          <div className="flex items-center">
            {messages.length > 1 && (
              <>
                <button 
                  className="text-white opacity-70 hover:opacity-100 p-1 rounded-full transition-opacity mr-2"
                  aria-label="Download chat"
                  title="Download chat as text file"
                  onClick={downloadChatAsText}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                <button 
                  className="text-white opacity-70 hover:opacity-100 p-1 rounded-full transition-opacity mr-2"
                  aria-label="Copy chat"
                  title="Copy chat to clipboard"
                  onClick={copyChatToClipboard}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button 
                  className="text-white opacity-70 hover:opacity-100 p-1 rounded-full transition-opacity mr-2"
                  aria-label="Clear chat history"
                  title="Clear chat history"
                  onClick={clearChatHistory}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </>
            )}
            <button 
              className="text-white opacity-70 hover:opacity-100 p-1 rounded-full transition-opacity"
              aria-label="Close chat"
              onClick={() => {
                // Send close message to parent window if in an iframe
                if (window.parent !== window) {
                  window.parent.postMessage({ type: 'attiy:close' }, '*');
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div 
        ref={messageContainerRef}
        className={`flex-1 overflow-y-auto p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        style={{ scrollBehavior: 'smooth' }}
        onScroll={handleScroll}
      >
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`mb-4 ${message.role === 'user' ? 'ml-auto max-w-[80%]' : 'mr-auto max-w-[80%]'}`}
          >
            <div 
              className={`relative rounded-lg p-3 ${
                message.role === 'user' 
                  ? `bg-primary text-primary-foreground ml-auto` 
                  : `${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${isDark ? 'text-white' : 'text-gray-800'}`
              }`}
              style={{ 
                backgroundColor: message.role === 'user' ? primaryColor : '',
                borderRadius: message.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
              }}
            >
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
              
              {message.timestamp && (
                <div className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-right text-white opacity-70' : `${isDark ? 'text-gray-400' : 'text-gray-500'}`}`}>
                  {formatTime(message.timestamp)}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex mr-auto mb-4">
            <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${isDark ? 'text-white' : 'text-gray-800'} rounded-tr-lg rounded-bl-lg rounded-br-lg`}>
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} p-3`}>
        <div className="flex items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={customPlaceholderText}
            className={`flex-1 outline-none resize-none overflow-hidden rounded-2xl min-h-[40px] max-h-[120px] ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} px-4 py-3 focus:ring-2 focus:ring-opacity-50`}
            style={{ 
              minHeight: '40px',
              borderTopRightRadius: mode === 'embed' ? '0' : '1rem', 
              borderBottomRightRadius: mode === 'embed' ? '0' : '1rem',
              boxShadow: 'none',
            }}
            aria-label="Message input"
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isSending}
            className="h-12 bg-primary text-primary-foreground rounded-r-2xl px-4 disabled:opacity-50 transition-opacity flex items-center justify-center"
            style={{ 
              backgroundColor: primaryColor,
              borderTopLeftRadius: '0', 
              borderBottomLeftRadius: '0',
              width: '44px'
            }}
            aria-label="Send message"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
        
        {/* Subtle branding message */}
        <div className="text-[10px] text-center mt-2 opacity-50">
          Powered by ATTIY
        </div>
      </div>
    </div>
  );
} 