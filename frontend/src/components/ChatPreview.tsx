import { useState, useRef, useEffect } from 'react';
import { sendDirectChatCompletionRequest } from '@/services/openai';
import { toast } from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatPreviewProps {
  theme: 'light' | 'dark' | 'system';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  customHeaderText?: string;
  customPlaceholderText?: string;
  welcomeMessage?: string;
  systemPrompt?: string;
  isInteractive?: boolean;
  apiKey?: string;
  modelName?: string;
  useRealApi?: boolean;
}

export function ChatPreview({
  theme,
  position,
  primaryColor,
  customHeaderText = 'Chat with us',
  customPlaceholderText = 'Type your message...',
  welcomeMessage = '👋 Hi! How can I help you today?',
  systemPrompt = '',
  isInteractive = true,
  apiKey = '',
  modelName = 'gpt-3.5-turbo',
  useRealApi = false
}: ChatPreviewProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: welcomeMessage }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Reset welcome message when it changes in props
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
  }, [welcomeMessage]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const sendMessage = async () => {
    if (!inputValue.trim() || !isInteractive) return;
    
    // Add user message
    const userMessage: Message = { role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
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
        
        // Make API call using the passed modelName
        const response = await sendDirectChatCompletionRequest({
          apiKey,
          modelName,
          messages: conversationHistory,
        });
        
        // Extract assistant's response
        if (response.choices && response.choices.length > 0) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: response.choices[0].message.content
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // Fallback if response format is unexpected
          throw new Error('Unexpected response format from API');
        }
      } else {
        // Simulate AI response (existing code)
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
        
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'I apologize, but I encountered an error processing your request. Please try again or check your API configuration.' 
        }
      ]);
      
      // Show error notification
      toast.error('Error connecting to AI service');
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex flex-col rounded-lg border shadow-lg h-full ${isDark ? 'dark bg-gray-900' : 'bg-white'} overflow-hidden`}>
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-t-lg p-4"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="text-white font-medium">{customHeaderText}</span>
        <button className="text-white opacity-70 hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {messages.map((message, index) => (
          <div key={index} className="flex items-start space-x-2">
            {message.role === 'assistant' && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
            )}
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-auto order-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? 'black' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
            <div 
              className={`rounded-lg p-3 ${
                message.role === 'assistant' 
                  ? isDark 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-gray-900'
                  : isDark
                    ? 'bg-blue-600 text-white ml-auto order-1'
                    : 'bg-blue-100 text-gray-900 ml-auto order-1'
              } ${message.role === 'user' ? 'max-w-[80%]' : 'max-w-[80%]'}`}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start space-x-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className={`rounded-lg p-3 max-w-[80%] ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}>
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t p-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-end">
          <textarea
            placeholder={customPlaceholderText}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 outline-none resize-none overflow-hidden rounded-2xl min-h-[40px] max-h-[120px] ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'} px-4 py-3 focus:ring-2 focus:ring-opacity-50`}
            style={{ 
              minHeight: '40px',
              boxShadow: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            className="h-12 bg-primary text-primary-foreground rounded-r-2xl px-4 disabled:opacity-50 transition-opacity flex items-center justify-center"
            style={{ 
              backgroundColor: primaryColor,
              width: '44px'
            }}
            disabled={!inputValue.trim() || !isInteractive}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 