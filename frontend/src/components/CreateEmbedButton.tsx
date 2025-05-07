'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTabs, DialogTab, DialogAccordion } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { createEmbed, fetchUserApiKeys, fetchAvailableModels } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { CopyButton } from '@/components/ui/CopyButton';
import { ChatPreview } from '@/components/ChatPreview';
import { Info as InfoIcon } from 'lucide-react';
import type { ChatEmbedConfig } from '@/types/embed';
import type { ApiKey } from '@/types/api-key';
import type { ModelInfo } from '@/types/models';
import { ApiKeySelect } from './ApiKeySelect';
import { generateEmbedCode, generateButtonEmbedCode } from '@/utils/generateEmbedCode';
// import { ColorPicker } from '@/components/ui/ColorPicker';

interface CreateEmbedButtonProps {
  teamId: string;
}

type TabValue = 'basic' | 'appearance' | 'ai' | 'advanced';

export function CreateEmbedButton({ teamId }: CreateEmbedButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('basic');
  const [useAccordion, setUseAccordion] = useState(false);
  
  // Basic Settings
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // Dimension settings
  const [isResponsive, setIsResponsive] = useState(true);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(600);
  
  // Advanced Settings
  const [settings, setSettings] = useState({
    allowAttachments: false,
    requireUserEmail: true,
    showBranding: true,
    maxTokensPerMessage: 2000,
    temperature: 0.7,
    messageHistory: 10,
    customHeaderText: '',
    customPlaceholderText: '',
    showTypingIndicator: true,
    enableMarkdown: true,
    enableCodeHighlighting: true,
    enableEmoji: true,
    rateLimit: {
      enabled: false,
      maxRequestsPerHour: 100
    }
  });

  const [embedId, setEmbedId] = useState<string | null>(null);
  const [showIntegration, setShowIntegration] = useState(false);

  // API key and model selection state
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  // Fetch user's API keys
  const { data: apiKeys = [] } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: fetchUserApiKeys,
  });

  // Fetch available models based on the selected API key
  const { data: availableModels = [], isLoading: isLoadingModels } = useQuery<ModelInfo[]>({
    queryKey: ['models', selectedApiKeyId],
    queryFn: () => fetchAvailableModels(selectedApiKeyId),
    enabled: !!selectedApiKeyId,
  });

  // Automatically select the default model when models load or API key changes
  useEffect(() => {
    if (availableModels.length > 0) {
      const defaultModel = availableModels.find(m => m.defaultModel);
      setSelectedModelId(defaultModel ? defaultModel.id : availableModels[0].id);
    } else {
      setSelectedModelId('');
    }
  }, [availableModels, selectedApiKeyId]);

  const queryClient = useQueryClient();

  const { mutate: createEmbedConfig, isPending } = useMutation({
    mutationFn: createEmbed,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['embeds', teamId] });
      setEmbedId(data.id);
      setShowIntegration(true);
      toast.success('Chat embed created successfully');
    },
    onError: () => {
      toast.error('Failed to create chat embed');
    },
  });

  const handleTabChange = (value: string) => {
    if (value === 'basic' || value === 'appearance' || value === 'ai' || value === 'advanced') {
      setActiveTab(value as TabValue);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTheme('light');
    setPosition('bottom-right');
    setPrimaryColor('#000000');
    setWelcomeMessage('');
    setSystemPrompt('');
    setSettings({
      allowAttachments: false,
      requireUserEmail: true,
      showBranding: true,
      maxTokensPerMessage: 2000,
      temperature: 0.7,
      messageHistory: 10,
      customHeaderText: '',
      customPlaceholderText: '',
      showTypingIndicator: true,
      enableMarkdown: true,
      enableCodeHighlighting: true,
      enableEmoji: true,
      rateLimit: {
        enabled: false,
        maxRequestsPerHour: 100
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit triggered. Name state:', name);

    // Add name validation
    if (!name || name.trim().length === 0) {
      console.log('Name validation failed. Name:', name);
      toast.error('Please enter a name for your embed');
      setActiveTab('basic'); // Focus the tab with the name input
      return;
    }

    if (!selectedApiKeyId) {
      toast.error('Please select an API key');
      setActiveTab('ai');
      return;
    }
    if (!selectedModelId) {
      toast.error('Please select a model');
      setActiveTab('ai');
      return;
    }

    const selectedApiKey = apiKeys.find(key => key.id === selectedApiKeyId);
    if (!selectedApiKey) {
      toast.error('Selected API key not found.');
      return;
    }

    const embedConfig: Omit<ChatEmbedConfig, 'id' | 'teamId' | 'createdAt' | 'updatedAt'> = {
      name,
      description,
      theme,
      position,
      primaryColor,
      welcomeMessage,
      systemPrompt,
      isActive: true,
      apiKeyId: selectedApiKeyId,
      modelVendor: selectedApiKey.vendor,
      modelName: selectedModelId,
      responsive: isResponsive,
      width: !isResponsive && width > 0 ? width : undefined,
      height: !isResponsive ? height : undefined,
      settings: {
        allowAttachments: settings.allowAttachments,
        requireUserEmail: settings.requireUserEmail,
        showBranding: settings.showBranding,
        maxTokensPerMessage: settings.maxTokensPerMessage,
        temperature: settings.temperature,
        messageHistory: settings.messageHistory,
        customHeaderText: settings.customHeaderText,
        customPlaceholderText: settings.customPlaceholderText,
        showTypingIndicator: settings.showTypingIndicator,
        enableMarkdown: settings.enableMarkdown,
        enableCodeHighlighting: settings.enableCodeHighlighting,
        enableEmoji: settings.enableEmoji,
        rateLimit: settings.rateLimit.enabled ? settings.rateLimit : undefined,
      }
    };

    console.log('Submitting embedConfig:', embedConfig);
    createEmbedConfig({ teamId, data: embedConfig });
    setSelectedApiKeyId('');
    setSelectedModelId('');
    setEmbedId(null);
    setShowIntegration(false);
    setActiveTab('basic');
  };

  const getEmbedCode = (type: 'script' | 'iframe' | 'button' | 'react' | 'vue' | 'next' | 'nuxt') => {
    if (!embedId) return '';
    
    // Get the base URL from environment variables
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Use our utility functions for standard and button embed codes
    switch (type) {
      case 'script':
        return generateEmbedCode(embedId, baseUrl);
        
      case 'button':
        // Use the custom header text as button text if available
        const buttonText = settings.customHeaderText || 'Chat with us';
        return generateButtonEmbedCode(embedId, baseUrl, buttonText, primaryColor);
        
      case 'iframe':
        // Generate dimension attributes for iframe
        const getDimensionAttributes = () => {
          if (isResponsive) {
            return 'width="100%" height="600px"';
          } else {
            const widthAttr = width > 0 ? `width="${width}px"` : 'width="100%"';
            return `${widthAttr} height="${height}px"`;
          }
        };
        
        return `<iframe
  src="${baseUrl}/embed/${embedId}"
  ${getDimensionAttributes()}
  frameborder="0"
  allow="clipboard-write"
  style="border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1); background: white;"
></iframe>`;

      case 'react':
        return `import { AttiyChat } from '@attiy/react';

function App() {
  return <AttiyChat 
    embedId="${embedId}"${!isResponsive ? `
    width="${width || 'auto'}"
    height="${height}px"` : ''}
  />;
}`;

      case 'vue':
        return `<template>
  <AttiyChat 
    embedId="${embedId}"${!isResponsive ? `
    width="${width || 'auto'}"
    height="${height}px"` : ''}
  />
</template>

<script setup>
import { AttiyChat } from '@attiy/vue';
</script>`;

      case 'next':
        return `import { AttiyChat } from '@attiy/react';

export default function Page() {
  return <AttiyChat 
    embedId="${embedId}"${!isResponsive ? `
    width="${width || 'auto'}"
    height="${height}px"` : ''}
  />;
}`;

      case 'nuxt':
        return `<template>
  <AttiyChat 
    embedId="${embedId}"${!isResponsive ? `
    width="${width || 'auto'}"
    height="${height}px"` : ''}
  />
</template>

<script setup>
import { AttiyChat } from '@attiy/vue';
</script>`;

      default:
        return '';
    }
  };

  const handleColorChange = (value: string) => {
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setPrimaryColor(value);
    } else if (/^[0-9A-Fa-f]{6}$/.test(value)) {
      setPrimaryColor(`#${value}`);
    }
  };

  // Group models by category for the dropdown
  const groupedModels = availableModels.reduce((acc, model) => {
    const category = model.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(model);
    return acc;
  }, {} as Record<string, ModelInfo[]>);

  // Find the full info for the selected model
  const selectedModelInfo = availableModels.find(model => model.id === selectedModelId);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Create Chat Embed
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>
              {showIntegration ? 'Integration Options' : 'Create New Chat Embed'}
            </DialogTitle>
          </DialogHeader>

          {!showIntegration ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseAccordion(!useAccordion)}
                      className="text-xs"
                    >
                      {useAccordion ? 'Switch to Tabs' : 'Switch to Accordion'}
                    </Button>
                  </div>
                  
                  {useAccordion ? (
                    <DialogAccordion
                      value={activeTab}
                      onValueChange={handleTabChange}
                      sections={[
                        {
                          title: "Basic Settings",
                          value: "basic",
                          content: (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="name" className="text-base font-medium">Name</Label>
                                  <span className="text-xs text-blue-600 font-medium">Required</span>
                                </div>
                                <Input
                                  id="name"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="My Website Chat"
                                  className="text-base"
                                  required
                                />
                                <p className="text-sm text-gray-500">
                                  Give your chat embed a unique, memorable name to easily identify it later.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                  id="description"
                                  value={description}
                                  onChange={(e) => setDescription(e.target.value)}
                                  placeholder="Chat widget for my company website"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="welcomeMessage">Welcome Message (Optional)</Label>
                                <Textarea
                                  id="welcomeMessage"
                                  value={welcomeMessage}
                                  onChange={(e) => setWelcomeMessage(e.target.value)}
                                  placeholder="👋 Hi! How can I help you today?"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
                                <Textarea
                                  id="systemPrompt"
                                  value={systemPrompt}
                                  onChange={(e) => setSystemPrompt(e.target.value)}
                                  placeholder="You are a helpful AI assistant..."
                                  className="h-32"
                                />
                                <p className="text-sm text-gray-500">
                                  Define the AI's behavior and knowledge context
                                </p>
                              </div>
                            </div>
                          )
                        },
                        {
                          title: "Appearance",
                          value: "appearance",
                          content: (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="theme">Theme</Label>
                                <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select theme" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="position">Position</Label>
                                <Select value={position} onValueChange={(value: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => setPosition(value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                    <SelectItem value="top-right">Top Right</SelectItem>
                                    <SelectItem value="top-left">Top Left</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="primaryColor">Primary Color</Label>
                                <div className="flex space-x-2">
                                  <div className="relative">
                                    <Input
                                      id="primaryColor"
                                      type="color"
                                      value={primaryColor}
                                      onChange={(e) => handleColorChange(e.target.value)}
                                      className="w-12 p-1 h-9 cursor-pointer"
                                    />
                                    <div 
                                      className="absolute inset-0 cursor-pointer" 
                                      style={{ backgroundColor: primaryColor }}
                                      onClick={() => document.getElementById('primaryColor')?.click()}
                                    />
                                  </div>
                                  <Input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    placeholder="#000000"
                                    className="flex-1"
                                  />
                                </div>
                              </div>

                              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
                                <h3 className="font-medium text-sm mb-3">Dimensions</h3>
                                
                                <div className="flex items-center justify-between mb-4">
                                  <div className="space-y-0.5">
                                    <Label>Responsive</Label>
                                    <p className="text-sm text-gray-500">Adapt to container size</p>
                                  </div>
                                  <Switch
                                    checked={isResponsive}
                                    onCheckedChange={setIsResponsive}
                                  />
                                </div>

                                {!isResponsive && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="width">Width (px)</Label>
                                      <Input
                                        id="width"
                                        type="number"
                                        value={width === 0 ? '' : width}
                                        onChange={(e) => setWidth(e.target.value ? parseInt(e.target.value, 10) : 0)}
                                        placeholder="Auto"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="height">Height (px)</Label>
                                      <Input
                                        id="height"
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value, 10) : 600)}
                                        placeholder="600"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="customHeaderText">Custom Header Text</Label>
                                <Input
                                  id="customHeaderText"
                                  value={settings.customHeaderText}
                                  onChange={(e) => setSettings({...settings, customHeaderText: e.target.value})}
                                  placeholder="Chat with us"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="customPlaceholderText">Input Placeholder Text</Label>
                                <Input
                                  id="customPlaceholderText"
                                  value={settings.customPlaceholderText}
                                  onChange={(e) => setSettings({...settings, customPlaceholderText: e.target.value})}
                                  placeholder="Type your message..."
                                />
                              </div>
                            </div>
                          )
                        },
                        {
                          title: "AI Configuration",
                          value: "ai",
                          content: (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key</Label>
                                <ApiKeySelect
                                  value={selectedApiKeyId}
                                  onChange={setSelectedApiKeyId}
                                />
                                {apiKeys.length === 0 && (
                                  <p className="text-sm text-yellow-600">
                                    No API keys found. Please add an API key in the API Keys section.
                                  </p>
                                )}
                                {!selectedApiKeyId && apiKeys.length > 0 && (
                                  <p className="text-sm text-yellow-600">Select an API key to choose a model.</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="aiModel">Model</Label>
                                <Select
                                  value={selectedModelId}
                                  onValueChange={setSelectedModelId}
                                  disabled={!selectedApiKeyId || isLoadingModels}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select AI model"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(groupedModels).map(([category, models]) => (
                                      <SelectGroup key={category}>
                                        <Label className="px-2 py-1.5 text-xs font-semibold text-gray-500">{category}</Label>
                                        {models.map((model) => (
                                          <SelectItem 
                                            key={model.id} 
                                            value={model.id}
                                            className={model.deprecated ? 'text-red-500 line-through' : ''}
                                          >
                                            {model.name} {model.deprecated ? '(Deprecated)' : ''}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    ))}
                                    {!isLoadingModels && availableModels.length === 0 && selectedApiKeyId && (
                                      <div className="p-2 text-sm text-gray-500">
                                        No models found for this API key or vendor.
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>
                                {selectedModelInfo && (
                                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                    {selectedModelInfo.description && <p>{selectedModelInfo.description}</p>}
                                    {selectedModelInfo.contextWindow && <p>Context Window: {selectedModelInfo.contextWindow.toLocaleString()} tokens</p>}
                                    {selectedModelInfo.pricingTier && <p>Tier: {selectedModelInfo.pricingTier}</p>}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor="temperature">Temperature ({settings.temperature})</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <InfoIcon className="h-4 w-4 text-gray-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Controls response randomness:<br/>
                                        0 = focused and deterministic<br/>
                                        2 = more creative and varied</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Slider
                                  id="temperature"
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  value={[settings.temperature]}
                                  onValueChange={([value]) => setSettings({...settings, temperature: value})}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="maxTokens">Max Tokens per Message ({settings.maxTokensPerMessage})</Label>
                                <Slider
                                  id="maxTokens"
                                  min={100}
                                  max={4000}
                                  step={100}
                                  value={[settings.maxTokensPerMessage]}
                                  onValueChange={([value]) => setSettings({...settings, maxTokensPerMessage: value})}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="messageHistory">Message History ({settings.messageHistory})</Label>
                                <Slider
                                  id="messageHistory"
                                  min={1}
                                  max={50}
                                  step={1}
                                  value={[settings.messageHistory]}
                                  onValueChange={([value]) => setSettings({...settings, messageHistory: value})}
                                />
                                <p className="text-sm text-gray-500">
                                  Number of previous messages to include for context
                                </p>
                              </div>
                            </div>
                          )
                        },
                        {
                          title: "Advanced",
                          value: "advanced",
                          content: (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Require Email</Label>
                                  <p className="text-sm text-gray-500">Ask users for their email before chatting</p>
                                </div>
                                <Switch
                                  checked={settings.requireUserEmail}
                                  onCheckedChange={(checked) => setSettings({...settings, requireUserEmail: checked})}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Allow Attachments</Label>
                                  <p className="text-sm text-gray-500">Let users upload files in chat</p>
                                </div>
                                <Switch
                                  checked={settings.allowAttachments}
                                  onCheckedChange={(checked) => setSettings({...settings, allowAttachments: checked})}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Show Branding</Label>
                                  <p className="text-sm text-gray-500">Display "Powered by ATTIY" in widget</p>
                                </div>
                                <Switch
                                  checked={settings.showBranding}
                                  onCheckedChange={(checked) => setSettings({...settings, showBranding: checked})}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Typing Indicator</Label>
                                  <p className="text-sm text-gray-500">Show when AI is generating response</p>
                                </div>
                                <Switch
                                  checked={settings.showTypingIndicator}
                                  onCheckedChange={(checked) => setSettings({...settings, showTypingIndicator: checked})}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Markdown Support</Label>
                                  <p className="text-sm text-gray-500">Enable markdown formatting in messages</p>
                                </div>
                                <Switch
                                  checked={settings.enableMarkdown}
                                  onCheckedChange={(checked) => setSettings({...settings, enableMarkdown: checked})}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Code Highlighting</Label>
                                  <p className="text-sm text-gray-500">Syntax highlighting for code blocks</p>
                                </div>
                                <Switch
                                  checked={settings.enableCodeHighlighting}
                                  onCheckedChange={(checked) => setSettings({...settings, enableCodeHighlighting: checked})}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Emoji Support</Label>
                                  <p className="text-sm text-gray-500">Enable emoji picker and conversion</p>
                                </div>
                                <Switch
                                  checked={settings.enableEmoji}
                                  onCheckedChange={(checked) => setSettings({...settings, enableEmoji: checked})}
                                />
                              </div>

                              <div className="space-y-2 pt-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label>Rate Limiting</Label>
                                    <p className="text-sm text-gray-500">Limit number of requests per hour</p>
                                  </div>
                                  <Switch
                                    checked={settings.rateLimit.enabled}
                                    onCheckedChange={(checked) => setSettings({
                                      ...settings,
                                      rateLimit: { ...settings.rateLimit, enabled: checked }
                                    })}
                                  />
                                </div>
                                {settings.rateLimit.enabled && (
                                  <div className="space-y-2 pt-2">
                                    <Label>Max Requests per Hour ({settings.rateLimit.maxRequestsPerHour})</Label>
                                    <Slider
                                      min={1}
                                      max={1000}
                                      step={10}
                                      value={[settings.rateLimit.maxRequestsPerHour]}
                                      onValueChange={([value]) => setSettings({
                                        ...settings,
                                        rateLimit: { ...settings.rateLimit, maxRequestsPerHour: value }
                                      })}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }
                      ]}
                    />
                  ) : (
                    <>
                      <DialogTabs value={activeTab} onValueChange={handleTabChange}>
                        <DialogTab value="basic">Basic Settings</DialogTab>
                        <DialogTab value="appearance">Appearance</DialogTab>
                        <DialogTab value="ai">AI Configuration</DialogTab>
                        <DialogTab value="advanced">Advanced</DialogTab>
                      </DialogTabs>

                      <div className="mt-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-950 dark:border-gray-800">
                        <form onSubmit={handleSubmit} className="space-y-5">
                          {(activeTab as string) === 'basic' && (
                            <>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="name" className="text-base font-medium">Name</Label>
                                  <span className="text-xs text-blue-600 font-medium">Required</span>
                                </div>
                                <Input
                                  id="name"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="My Website Chat"
                                  className="text-base"
                                  required
                                />
                                <p className="text-sm text-gray-500">
                                  Give your chat embed a unique, memorable name to easily identify it later.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                  id="description"
                                  value={description}
                                  onChange={(e) => setDescription(e.target.value)}
                                  placeholder="Chat widget for my company website"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="welcomeMessage">Welcome Message (Optional)</Label>
                                <Textarea
                                  id="welcomeMessage"
                                  value={welcomeMessage}
                                  onChange={(e) => setWelcomeMessage(e.target.value)}
                                  placeholder="👋 Hi! How can I help you today?"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
                                <Textarea
                                  id="systemPrompt"
                                  value={systemPrompt}
                                  onChange={(e) => setSystemPrompt(e.target.value)}
                                  placeholder="You are a helpful AI assistant..."
                                  className="h-32"
                                />
                                <p className="text-sm text-gray-500">
                                  Define the AI's behavior and knowledge context
                                </p>
                              </div>
                            </>
                          )}

                          {(activeTab as string) === 'appearance' && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="theme">Theme</Label>
                                <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select theme" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="position">Position</Label>
                                <Select value={position} onValueChange={(value: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => setPosition(value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                    <SelectItem value="top-right">Top Right</SelectItem>
                                    <SelectItem value="top-left">Top Left</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="primaryColor">Primary Color</Label>
                                <div className="flex space-x-2">
                                  <div className="relative">
                                    <Input
                                      id="primaryColor"
                                      type="color"
                                      value={primaryColor}
                                      onChange={(e) => handleColorChange(e.target.value)}
                                      className="w-12 p-1 h-9 cursor-pointer"
                                    />
                                    <div 
                                      className="absolute inset-0 cursor-pointer" 
                                      style={{ backgroundColor: primaryColor }}
                                      onClick={() => document.getElementById('primaryColor')?.click()}
                                    />
                                  </div>
                                  <Input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    placeholder="#000000"
                                    className="flex-1"
                                  />
                                </div>
                              </div>

                              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
                                <h3 className="font-medium text-sm mb-3">Dimensions</h3>
                                
                                <div className="flex items-center justify-between mb-4">
                                  <div className="space-y-0.5">
                                    <Label>Responsive</Label>
                                    <p className="text-sm text-gray-500">Adapt to container size</p>
                                  </div>
                                  <Switch
                                    checked={isResponsive}
                                    onCheckedChange={setIsResponsive}
                                  />
                                </div>

                                {!isResponsive && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="width">Width (px)</Label>
                                      <Input
                                        id="width"
                                        type="number"
                                        value={width === 0 ? '' : width}
                                        onChange={(e) => setWidth(e.target.value ? parseInt(e.target.value, 10) : 0)}
                                        placeholder="Auto"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="height">Height (px)</Label>
                                      <Input
                                        id="height"
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value, 10) : 600)}
                                        placeholder="600"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="customHeaderText">Custom Header Text</Label>
                                <Input
                                  id="customHeaderText"
                                  value={settings.customHeaderText}
                                  onChange={(e) => setSettings({...settings, customHeaderText: e.target.value})}
                                  placeholder="Chat with us"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="customPlaceholderText">Input Placeholder Text</Label>
                                <Input
                                  id="customPlaceholderText"
                                  value={settings.customPlaceholderText}
                                  onChange={(e) => setSettings({...settings, customPlaceholderText: e.target.value})}
                                  placeholder="Type your message..."
                                />
                              </div>
                            </>
                          )}

                          {(activeTab as string) === 'ai' && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key</Label>
                                <ApiKeySelect
                                  value={selectedApiKeyId}
                                  onChange={setSelectedApiKeyId}
                                />
                                {apiKeys.length === 0 && (
                                  <p className="text-sm text-yellow-600">
                                    No API keys found. Please add an API key in the API Keys section.
                                  </p>
                                )}
                                {!selectedApiKeyId && apiKeys.length > 0 && (
                                  <p className="text-sm text-yellow-600">Select an API key to choose a model.</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="aiModel">Model</Label>
                                <Select
                                  value={selectedModelId}
                                  onValueChange={setSelectedModelId}
                                  disabled={!selectedApiKeyId || isLoadingModels}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select AI model"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(groupedModels).map(([category, models]) => (
                                      <SelectGroup key={category}>
                                        <Label className="px-2 py-1.5 text-xs font-semibold text-gray-500">{category}</Label>
                                        {models.map((model) => (
                                          <SelectItem 
                                            key={model.id} 
                                            value={model.id}
                                            className={model.deprecated ? 'text-red-500 line-through' : ''}
                                          >
                                            {model.name} {model.deprecated ? '(Deprecated)' : ''}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    ))}
                                    {!isLoadingModels && availableModels.length === 0 && selectedApiKeyId && (
                                      <div className="p-2 text-sm text-gray-500">
                                        No models found for this API key or vendor.
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>
                                {selectedModelInfo && (
                                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                    {selectedModelInfo.description && <p>{selectedModelInfo.description}</p>}
                                    {selectedModelInfo.contextWindow && <p>Context Window: {selectedModelInfo.contextWindow.toLocaleString()} tokens</p>}
                                    {selectedModelInfo.pricingTier && <p>Tier: {selectedModelInfo.pricingTier}</p>}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor="temperature">Temperature ({settings.temperature})</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <InfoIcon className="h-4 w-4 text-gray-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Controls response randomness:<br/>
                                        0 = focused and deterministic<br/>
                                        2 = more creative and varied</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Slider
                                  id="temperature"
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  value={[settings.temperature]}
                                  onValueChange={([value]) => setSettings({...settings, temperature: value})}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="maxTokens">Max Tokens per Message ({settings.maxTokensPerMessage})</Label>
                                <Slider
                                  id="maxTokens"
                                  min={100}
                                  max={4000}
                                  step={100}
                                  value={[settings.maxTokensPerMessage]}
                                  onValueChange={([value]) => setSettings({...settings, maxTokensPerMessage: value})}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="messageHistory">Message History ({settings.messageHistory})</Label>
                                <Slider
                                  id="messageHistory"
                                  min={1}
                                  max={50}
                                  step={1}
                                  value={[settings.messageHistory]}
                                  onValueChange={([value]) => setSettings({...settings, messageHistory: value})}
                                />
                                <p className="text-sm text-gray-500">
                                  Number of previous messages to include for context
                                </p>
                              </div>
                            </>
                          )}

                          {(activeTab as string) === 'advanced' && (
                            <>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label>Require Email</Label>
                                    <p className="text-sm text-gray-500">Ask users for their email before chatting</p>
                                  </div>
                                  <Switch
                                    checked={settings.requireUserEmail}
                                    onCheckedChange={(checked) => setSettings({...settings, requireUserEmail: checked})}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label>Allow Attachments</Label>
                                    <p className="text-sm text-gray-500">Let users upload files in chat</p>
                                  </div>
                                  <Switch
                                    checked={settings.allowAttachments}
                                    onCheckedChange={(checked) => setSettings({...settings, allowAttachments: checked})}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label>Show Branding</Label>
                                    <p className="text-sm text-gray-500">Display "Powered by ATTIY" in widget</p>
                                  </div>
                                  <Switch
                                    checked={settings.showBranding}
                                    onCheckedChange={(checked) => setSettings({...settings, showBranding: checked})}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label>Typing Indicator</Label>
                                    <p className="text-sm text-gray-500">Show when AI is generating response</p>
                                  </div>
                                  <Switch
                                    checked={settings.showTypingIndicator}
                                    onCheckedChange={(checked) => setSettings({...settings, showTypingIndicator: checked})}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label>Markdown Support</Label>
                                    <p className="text-sm text-gray-500">Enable markdown formatting in messages</p>
                                  </div>
                                  <Switch
                                    checked={settings.enableMarkdown}
                                    onCheckedChange={(checked) => setSettings({...settings, enableMarkdown: checked})}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label>Code Highlighting</Label>
                                    <p className="text-sm text-gray-500">Syntax highlighting for code blocks</p>
                                  </div>
                                  <Switch
                                    checked={settings.enableCodeHighlighting}
                                    onCheckedChange={(checked) => setSettings({...settings, enableCodeHighlighting: checked})}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label>Emoji Support</Label>
                                    <p className="text-sm text-gray-500">Enable emoji picker and conversion</p>
                                  </div>
                                  <Switch
                                    checked={settings.enableEmoji}
                                    onCheckedChange={(checked) => setSettings({...settings, enableEmoji: checked})}
                                  />
                                </div>

                                <div className="space-y-2 pt-4">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <Label>Rate Limiting</Label>
                                      <p className="text-sm text-gray-500">Limit number of requests per hour</p>
                                    </div>
                                    <Switch
                                      checked={settings.rateLimit.enabled}
                                      onCheckedChange={(checked) => setSettings({
                                        ...settings,
                                        rateLimit: { ...settings.rateLimit, enabled: checked }
                                      })}
                                    />
                                  </div>
                                  {settings.rateLimit.enabled && (
                                    <div className="space-y-2 pt-2">
                                      <Label>Max Requests per Hour ({settings.rateLimit.maxRequestsPerHour})</Label>
                                      <Slider
                                        min={1}
                                        max={1000}
                                        step={10}
                                        value={[settings.rateLimit.maxRequestsPerHour]}
                                        onValueChange={([value]) => setSettings({
                                          ...settings,
                                          rateLimit: { ...settings.rateLimit, maxRequestsPerHour: value }
                                        })}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </form>
                      </div>
                    </>
                  )}

                  {!useAccordion && (
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setOpen(false)} type="button">
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" disabled={isPending} onClick={handleSubmit}>
                        {isPending ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  )}

                  {useAccordion && (
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setOpen(false)} type="button">
                        Cancel
                      </Button>
                      <Button type="button" variant="primary" disabled={isPending} onClick={handleSubmit}>
                        {isPending ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="sticky top-6">
                    <h3 className="font-medium mb-3">Preview</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-800">
                      <ChatPreview 
                        theme={theme} 
                        position={position} 
                        primaryColor={primaryColor}
                        welcomeMessage={welcomeMessage || '👋 Hi! How can I help you today?'}
                        customHeaderText={settings.customHeaderText}
                        customPlaceholderText={settings.customPlaceholderText}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>HTML Script Tag (Recommended)</Label>
                  <div className="relative">
                    <pre className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                      <code className="text-sm">{getEmbedCode('script')}</code>
                    </pre>
                    <CopyButton value={getEmbedCode('script')} className="absolute right-2 top-2" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Add this code to your HTML where you want the chat widget to appear.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Button Embed</Label>
                  <div className="relative">
                    <pre className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                      <code className="text-sm">{getEmbedCode('button')}</code>
                    </pre>
                    <CopyButton value={getEmbedCode('button')} className="absolute right-2 top-2" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Add this code to embed a button that opens the chat widget when clicked.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>IFrame Embed</Label>
                  <div className="relative">
                    <pre className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                      <code className="text-sm">{getEmbedCode('iframe')}</code>
                    </pre>
                    <CopyButton value={getEmbedCode('iframe')} className="absolute right-2 top-2" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Use this if you want to embed the chat in a fixed container.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>React Component</Label>
                  <div className="relative">
                    <pre className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                      <code className="text-sm">{getEmbedCode('react')}</code>
                    </pre>
                    <CopyButton value={getEmbedCode('react')} className="absolute right-2 top-2" />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <code className="text-sm">npm install @attiy/react</code>
                    <CopyButton value="npm install @attiy/react" variant="secondary" size="sm" />
                  </div>

                  <Label>Vue Component</Label>
                  <div className="relative">
                    <pre className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                      <code className="text-sm">{getEmbedCode('vue')}</code>
                    </pre>
                    <CopyButton value={getEmbedCode('vue')} className="absolute right-2 top-2" />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <code className="text-sm">npm install @attiy/vue</code>
                    <CopyButton value="npm install @attiy/vue" variant="secondary" size="sm" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowIntegration(false);
                  resetForm();
                  setOpen(false);
                }}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowIntegration(false);
                  resetForm();
                }}>
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 