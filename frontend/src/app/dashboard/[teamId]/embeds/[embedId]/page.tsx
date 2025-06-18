'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { ApiKeySelect } from '@/components/ApiKeySelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/Select';
import { fetchEmbed, updateEmbed, fetchUserApiKeys, fetchApiKeyWithValue, fetchAvailableModels } from '@/lib/api';
import type { ChatEmbedConfig } from '@/types/embed';
import type { ApiKey } from '@/types/api-key';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { ChatPreview } from '@/components/ChatPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import type { ModelInfo } from '@/types/models';
import { CopyButton } from '@/components/ui/CopyButton';

interface EmbedConfigPageProps {
  params: {
    teamId: string;
    embedId: string;
  };
}

export default function EmbedConfigPage({ params }: EmbedConfigPageProps) {
  const { teamId, embedId } = params;
  const queryClient = useQueryClient();

  const { data: embed, isPending } = useQuery<ChatEmbedConfig>({
    queryKey: ['embeds', teamId, embedId],
    queryFn: () => fetchEmbed({ teamId, embedId }),
  });

  // Fetch all API keys so we can look up the vendor for the selected key
  const { data: apiKeys = [] } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: fetchUserApiKeys,
  });

  const [selectedApiKeyId, setSelectedApiKeyId] = useState(embed?.apiKeyId || '');
  const [selectedModelId, setSelectedModelId] = useState(embed?.modelName || 'gpt-4');
  const [systemPrompt, setSystemPrompt] = useState(embed?.systemPrompt || '');
  const [responsive, setResponsive] = useState(embed?.responsive ?? true);
  const [width, setWidth] = useState(embed?.width ?? 400);
  const [height, setHeight] = useState(embed?.height ?? 500);
  const [sizePreset, setSizePreset] = useState(() => {
    if (responsive) return 'responsive';
    if (width === 300 && height === 400) return 'small';
    if (width === 400 && height === 500) return 'medium';
    if (width === 500 && height === 600) return 'large';
    return 'custom';
  });
  const [activeTab, setActiveTab] = useState('config');
  const [activeIntegrationTab, setActiveIntegrationTab] = useState('script');
  
  // Add state for appearance settings
  const [theme, setTheme] = useState(embed?.theme || 'light');
  const [position, setPosition] = useState(embed?.position || 'bottom-right');
  const [primaryColor, setPrimaryColor] = useState(embed?.primaryColor || '#000000');
  const [welcomeMessage, setWelcomeMessage] = useState(embed?.welcomeMessage || '👋 Hi! How can I help you today?');
  const [customHeaderText, setCustomHeaderText] = useState(embed?.settings?.customHeaderText || 'Chat with us');
  const [customPlaceholderText, setCustomPlaceholderText] = useState(embed?.settings?.customPlaceholderText || 'Type your message...');
  const [backgroundColor, setBackgroundColor] = useState(embed?.settings?.backgroundColor || '#FFFFFF');
  
  // Add state for model settings
  const [temperature, setTemperature] = useState(embed?.settings?.temperature ?? 0.7);
  const [maxTokensPerMessage, setMaxTokensPerMessage] = useState(embed?.settings?.maxTokensPerMessage ?? 2000);
  const [messageHistory, setMessageHistory] = useState(embed?.settings?.messageHistory ?? 10);
  
  // Add state for advanced settings
  const [allowAttachments, setAllowAttachments] = useState(embed?.settings?.allowAttachments ?? false);
  const [showBranding, setShowBranding] = useState(embed?.settings?.showBranding ?? true);
  const [enableMarkdown, setEnableMarkdown] = useState(embed?.settings?.enableMarkdown ?? true);
  const [enableCodeHighlighting, setEnableCodeHighlighting] = useState(embed?.settings?.enableCodeHighlighting ?? true);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(embed?.settings?.rateLimit?.enabled ?? false);
  const [maxRequestsPerHour, setMaxRequestsPerHour] = useState(embed?.settings?.rateLimit?.maxRequestsPerHour ?? 60);

  // Add state for test mode in preview
  const [useRealApi, setUseRealApi] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const [showApiConfirmDialog, setShowApiConfirmDialog] = useState(false);

  // Fetch available models based on the selected API key
  const { data: availableModels = [], isLoading: isLoadingModels } = useQuery<ModelInfo[]>({
    queryKey: ['models', selectedApiKeyId],
    queryFn: () => fetchAvailableModels(selectedApiKeyId),
    enabled: !!selectedApiKeyId, // Only fetch if an API key is selected
  });

  // Sync state with embed data when it changes
  useEffect(() => {
    if (embed) {
      setSelectedApiKeyId(embed.apiKeyId || '');
      setSelectedModelId(embed.modelName || 'gpt-4');
      setSystemPrompt(embed.systemPrompt || '');
      setResponsive(embed.responsive ?? true);
      setWidth(embed.width ?? 400);
      setHeight(embed.height ?? 500);
      setTheme(embed.theme || 'light');
      setPosition(embed.position || 'bottom-right');
      setPrimaryColor(embed.primaryColor || '#000000');
      setWelcomeMessage(embed.welcomeMessage || '👋 Hi! How can I help you today?');
      setCustomHeaderText(embed.settings?.customHeaderText || 'Chat with us');
      setCustomPlaceholderText(embed.settings?.customPlaceholderText || 'Type your message...');
      setBackgroundColor(embed.settings?.backgroundColor || '#FFFFFF');
      
      // Sync model settings
      setTemperature(embed.settings?.temperature ?? 0.7);
      setMaxTokensPerMessage(embed.settings?.maxTokensPerMessage ?? 2000);
      setMessageHistory(embed.settings?.messageHistory ?? 10);
      
      // Sync advanced settings
      setAllowAttachments(embed.settings?.allowAttachments ?? false);
      setShowBranding(embed.settings?.showBranding ?? true);
      setEnableMarkdown(embed.settings?.enableMarkdown ?? true);
      setEnableCodeHighlighting(embed.settings?.enableCodeHighlighting ?? true);
      setRateLimitEnabled(embed.settings?.rateLimit?.enabled ?? false);
      setMaxRequestsPerHour(embed.settings?.rateLimit?.maxRequestsPerHour ?? 60);
      
      // Update size preset based on dimensions
      if (embed.responsive) {
        setSizePreset('responsive');
      } else if (embed.width === 300 && embed.height === 400) {
        setSizePreset('small');
      } else if (embed.width === 400 && embed.height === 500) {
        setSizePreset('medium');
      } else if (embed.width === 500 && embed.height === 600) {
        setSizePreset('large');
      } else {
        setSizePreset('custom');
      }
    }
  }, [embed]);

  // Handle API usage toggle with confirmation
  const handleApiToggle = (checked: boolean) => {
    if (checked && !useRealApi) {
      setShowApiConfirmDialog(true);
    } else {
      setUseRealApi(checked);
      if (!checked) {
        setApiKeyValue(''); // Clear key value if toggled off
      }
    }
  };

  // Confirm API usage
  const confirmApiUsage = () => {
    setUseRealApi(true);
    setShowApiConfirmDialog(false);
  };

  // Fetch the API key value when selected and API usage is enabled
  useEffect(() => {
    if (selectedApiKeyId && useRealApi) {
      const fetchKeyValue = async () => {
        setIsLoadingKey(true);
        try {
          const keyData = await fetchApiKeyWithValue(selectedApiKeyId);
          setApiKeyValue(keyData.key);
        } catch (error) {
          console.error('Error fetching API key:', error);
          toast.error('Failed to load API key value for testing');
          setUseRealApi(false); // Turn off API usage if key fetching fails
        } finally {
          setIsLoadingKey(false);
        }
      };
      
      fetchKeyValue();
    } else {
      setApiKeyValue(''); // Clear if key or API usage changes
    }
  }, [selectedApiKeyId, useRealApi]);

  const { mutate: updateEmbedConfig, isPending: isUpdating } = useMutation({
    mutationFn: (data: Partial<ChatEmbedConfig>) =>
      updateEmbed({ teamId, embedId, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embeds', teamId, embedId] });
      toast.success('Embed configuration updated');
    },
    onError: () => {
      toast.error('Failed to update embed configuration');
    },
  });

  // Group models by category
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

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!embed) {
    return <div>Embed not found</div>;
  }

  // Find the vendor for the selected API key
  const selectedApiKey = apiKeys.find(key => key.id === selectedApiKeyId);
  const selectedVendor = selectedApiKey ? selectedApiKey.vendor : 'openai';

  // Preset handler
  const handlePresetChange = (preset: string) => {
    setSizePreset(preset);
    if (preset === 'responsive') {
      setResponsive(true);
    } else {
      setResponsive(false);
      if (preset === 'small') {
        setWidth(300); setHeight(400);
      } else if (preset === 'medium') {
        setWidth(400); setHeight(500);
      } else if (preset === 'large') {
        setWidth(500); setHeight(600);
      }
    }
  };

  const handleSave = () => {
    updateEmbedConfig({
      apiKeyId: selectedApiKeyId,
      modelName: selectedModelId,
      modelVendor: selectedVendor,
      systemPrompt,
      responsive,
      width: responsive ? undefined : width,
      height: responsive ? undefined : height,
      theme,
      position,
      primaryColor,
      welcomeMessage,
      settings: {
        ...embed.settings,
        customHeaderText,
        customPlaceholderText,
        backgroundColor,
        temperature,
        maxTokensPerMessage,
        messageHistory,
        // Advanced settings
        allowAttachments,
        showBranding,
        enableMarkdown,
        enableCodeHighlighting,
        rateLimit: {
          enabled: rateLimitEnabled,
          maxRequestsPerHour: maxRequestsPerHour
        }
      }
    });
  };

  // Helper to get the public app URL for the embed script
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.attiy.com';

  // Generate embed code snippets for different integration types
  const getEmbedCode = (type: 'script' | 'iframe' | 'react' | 'vue' | 'next' | 'nuxt') => {
    // Generate dimension attributes for iframe
    const getDimensionAttributes = () => {
      if (responsive) {
        return 'width="100%" height="600px"';
      } else {
        const widthAttr = width > 0 ? `width="${width}px"` : 'width="100%"';
        return `${widthAttr} height="${height}px"`;
      }
    };

    switch (type) {
      case 'script':
        return `<div data-embed-id="${embedId}" data-position="${position}" data-primary-color="${primaryColor}"></div>\n<script src="${appUrl}/embed.js" async></script>`;
      
      case 'iframe':
        return `<iframe
  src="${appUrl}/embed/${embedId}"
  ${getDimensionAttributes()}
  frameborder="0"
  allow="microphone"
></iframe>`;
      
      case 'react':
        return `import { AttiyChat } from '@attiy/react';

function App() {
  return <AttiyChat 
    embedId="${embedId}"${!responsive ? `
    width="${width || 'auto'}"
    height="${height}px"` : ''}
  />;
}`;
      
      case 'vue':
        return `<template>
  <AttiyChat 
    embedId="${embedId}"${!responsive ? `
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
    embedId="${embedId}"${!responsive ? `
    width="${width || 'auto'}"
    height="${height}px"` : ''}
  />;
}`;

      case 'nuxt':
        return `<template>
  <AttiyChat 
    embedId="${embedId}"${!responsive ? `
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

  // Define embed code snippets for different integration types
  const scriptCode = getEmbedCode('script');
  const iframeCode = getEmbedCode('iframe');
  const reactCode = getEmbedCode('react');
  const vueCode = getEmbedCode('vue');

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={embed.name}
        description="Configure your chat widget settings"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="grid w-full md:w-64 grid-cols-2">
          <TabsTrigger value="config">Configure</TabsTrigger>
          <TabsTrigger value="preview">Try It Yourself</TabsTrigger>
        </TabsList>
        
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TabsContent value="config" className="mt-0">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">AI Configuration</h3>
                    <p className="text-sm text-gray-500">
                      Configure the AI model and API key for this chat widget
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <ApiKeySelect
                        value={selectedApiKeyId}
                        onChange={setSelectedApiKeyId}
                      />
                      {!selectedApiKeyId && (
                        <p className="text-sm text-yellow-600">Select an API key to choose a model.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
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
                      <Label htmlFor="temperature">Temperature ({temperature})</Label>
                      <div className="px-1">
                        <input
                          id="temperature"
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Lower values make responses more deterministic, higher values more creative.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxTokensPerMessage">Max Tokens per Message ({maxTokensPerMessage})</Label>
                      <div className="px-1">
                        <input
                          id="maxTokensPerMessage"
                          type="range"
                          min="100"
                          max="4000"
                          step="100"
                          value={maxTokensPerMessage}
                          onChange={(e) => setMaxTokensPerMessage(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Maximum number of tokens the AI can generate per message.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="messageHistory">Message History ({messageHistory})</Label>
                      <div className="px-1">
                        <input
                          id="messageHistory"
                          type="range"
                          min="1"
                          max="50"
                          step="1"
                          value={messageHistory}
                          onChange={(e) => setMessageHistory(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Number of previous messages to include for context.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
                      <Textarea
                        id="systemPrompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="e.g., You are a helpful assistant for our website visitors."
                        rows={4}
                        maxLength={2000}
                      />
                      <p className="text-xs text-gray-500">
                        Max {2000 - (systemPrompt?.length || 0)} characters remaining.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
                    <div>
                      <h3 className="text-lg font-medium">Appearance</h3>
                      <p className="text-sm text-gray-500">
                        Customize how your chat widget looks to match your branding
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                          <SelectTrigger id="theme">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System (Auto)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Changes are reflected immediately in the preview.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Select value={position} onValueChange={(value: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => setPosition(value)}>
                          <SelectTrigger id="position">
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
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-md border border-gray-200 dark:border-gray-700"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <Input
                            id="primaryColor"
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-20 h-10 p-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Changes are reflected immediately in the preview.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="backgroundColor">Background Color</Label>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-md border border-gray-200 dark:border-gray-700"
                            style={{ backgroundColor: backgroundColor }}
                          />
                          <Input id="backgroundColor" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-20 h-10 p-1" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Set the background color of the chat widget.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="welcomeMessage">Welcome Message</Label>
                        <Input
                          id="welcomeMessage"
                          value={welcomeMessage}
                          onChange={e => setWelcomeMessage(e.target.value)}
                          placeholder="👋 Hi! How can I help you today?"
                        />
                        <p className="text-xs text-muted-foreground">
                          Changes are reflected immediately in the preview.
                        </p>
                      </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="customHeaderText">Header Text</Label>
                        <Input
                          id="customHeaderText"
                          value={customHeaderText}
                          onChange={e => setCustomHeaderText(e.target.value)}
                          placeholder="Chat with us"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customPlaceholderText">Input Placeholder</Label>
                        <Input
                          id="customPlaceholderText"
                          value={customPlaceholderText}
                          onChange={e => setCustomPlaceholderText(e.target.value)}
                          placeholder="Type your message..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Widget Size Section */}
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
                    <div className="space-y-2">
                      <Label>Widget Size</Label>
                      <div className="flex flex-wrap gap-2 items-center">
                        <Select value={sizePreset} onValueChange={handlePresetChange}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="responsive">Responsive (default)</SelectItem>
                            <SelectItem value="small">Small (300x400)</SelectItem>
                            <SelectItem value="medium">Medium (400x500)</SelectItem>
                            <SelectItem value="large">Large (500x600)</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <Switch
                          checked={responsive}
                          onCheckedChange={checked => {
                            setResponsive(checked);
                            setSizePreset(checked ? 'responsive' : 'custom');
                          }}
                          className="ml-4"
                        />
                        <span className="text-sm">Responsive</span>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div>
                          <Label htmlFor="width">Width (px)</Label>
                          <input
                            id="width"
                            type="number"
                            min={200}
                            max={1200}
                            value={width}
                            onChange={e => { setWidth(Number(e.target.value)); setSizePreset('custom'); setResponsive(false); }}
                            disabled={responsive}
                            className="input input-bordered w-24"
                          />
                        </div>
                        <div>
                          <Label htmlFor="height">Height (px)</Label>
                          <input
                            id="height"
                            type="number"
                            min={200}
                            max={1200}
                            value={height}
                            onChange={e => { setHeight(Number(e.target.value)); setSizePreset('custom'); setResponsive(false); }}
                            disabled={responsive}
                            className="input input-bordered w-24"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose a preset or set custom dimensions. If responsive is enabled, the widget will adapt to its container.
                      </p>
                    </div>
                  </div>

                  {/* Advanced Settings Section */}
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
                    <div>
                      <h3 className="text-lg font-medium">Advanced Options</h3>
                      <p className="text-sm text-gray-500">
                        Configure additional functionality for your chat widget
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowAttachments" className="cursor-pointer">Allow Attachments</Label>
                          <Switch
                            id="allowAttachments"
                            checked={allowAttachments}
                            onCheckedChange={setAllowAttachments}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Let users upload files when chatting.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showBranding" className="cursor-pointer">Show Branding</Label>
                          <Switch
                            id="showBranding"
                            checked={showBranding}
                            onCheckedChange={setShowBranding}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Display "Powered by AITIY" in the chat widget.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="enableMarkdown" className="cursor-pointer">Markdown Support</Label>
                          <Switch
                            id="enableMarkdown"
                            checked={enableMarkdown}
                            onCheckedChange={setEnableMarkdown}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enable Markdown formatting in messages.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="enableCodeHighlighting" className="cursor-pointer">Code Highlighting</Label>
                          <Switch
                            id="enableCodeHighlighting"
                            checked={enableCodeHighlighting}
                            onCheckedChange={setEnableCodeHighlighting}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Apply syntax highlighting to code blocks.
                        </p>
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="rateLimitEnabled" className="cursor-pointer">Rate Limiting</Label>
                            <p className="text-xs text-muted-foreground">
                              Limit the number of requests per hour from each user.
                            </p>
                          </div>
                          <Switch
                            id="rateLimitEnabled"
                            checked={rateLimitEnabled}
                            onCheckedChange={setRateLimitEnabled}
                          />
                        </div>
                        
                        {rateLimitEnabled && (
                          <div className="mt-3 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                            <div className="space-y-2">
                              <Label htmlFor="maxRequestsPerHour">Max Requests Per Hour ({maxRequestsPerHour})</Label>
                              <div className="px-1 flex items-center gap-3">
                                <input
                                  id="maxRequestsPerHour"
                                  type="range"
                                  min="1"
                                  max="100"
                                  step="1"
                                  value={maxRequestsPerHour}
                                  onChange={(e) => setMaxRequestsPerHour(parseInt(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button
                      onClick={handleSave}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Try It Yourself</h3>
                    <p className="text-sm text-gray-500">
                      Interact with your chat widget to see how it works with the current settings
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <h4 className="font-medium mb-2">API Testing Mode</h4>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={useRealApi} 
                          onCheckedChange={handleApiToggle}
                          disabled={!selectedApiKeyId}
                          className="data-[state=checked]:bg-blue-600"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {useRealApi ? 'Using Real OpenAI API' : 'Using Simulation Mode'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {useRealApi 
                              ? 'Real API calls using your API key' 
                              : 'Responses are simulated, no API usage'}
                          </span>
                        </div>
                      </div>
                      
                      {useRealApi && isLoadingKey && (
                        <div className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                          Loading API key...
                        </div>
                      )}
                      
                      {!selectedApiKeyId && (
                        <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                          Select an API key first
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-6 dark:border-gray-800">
                    <div className="max-w-md mx-auto" style={{ height: responsive ? 'auto' : `${height}px` }}>
                      <ChatPreview 
                        theme={theme} 
                        position={position} 
                        primaryColor={primaryColor}
                        welcomeMessage={welcomeMessage}
                        customHeaderText={customHeaderText}
                        customPlaceholderText={customPlaceholderText}
                        systemPrompt={systemPrompt}
                        isInteractive={true}
                        apiKey={apiKeyValue}
                        modelName={selectedModelId}
                        useRealApi={useRealApi && !!apiKeyValue}
                        temperature={temperature}
                        maxTokensPerMessage={maxTokensPerMessage}
                        messageHistory={messageHistory}
                        allowAttachments={allowAttachments}
                        showBranding={showBranding}
                        enableMarkdown={enableMarkdown}
                        enableCodeHighlighting={enableCodeHighlighting}
                        backgroundColor={backgroundColor}
                      />
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${useRealApi ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'}`}>
                    <p className="text-sm">
                      {useRealApi ? (
                        <>
                          <strong>Using Real API:</strong> This preview is now connected to the OpenAI API using your selected API key. 
                          Each message will count towards your API usage. Responses will reflect the actual behavior of your deployed widget.
                        </>
                      ) : (
                        <>
                          <strong>Interactive Preview:</strong> This preview updates in real-time as you change configuration settings. 
                          Try modifying the theme, colors, or system prompt to see immediate changes.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Live Preview</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-800" style={{ height: responsive ? 'auto' : `${Math.min(height, 450)}px` }}>
                  <ChatPreview 
                    theme={theme} 
                    position={position} 
                    primaryColor={primaryColor}
                    welcomeMessage={welcomeMessage}
                    customHeaderText={customHeaderText}
                    customPlaceholderText={customPlaceholderText}
                    systemPrompt={systemPrompt}
                    temperature={temperature}
                    maxTokensPerMessage={maxTokensPerMessage}
                    messageHistory={messageHistory}
                    allowAttachments={allowAttachments}
                    showBranding={showBranding}
                    enableMarkdown={enableMarkdown}
                    enableCodeHighlighting={enableCodeHighlighting}
                    backgroundColor={backgroundColor}
                  />
                </div>
                <div className="flex items-center mt-4 text-sm text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                  <p>
                    Real-time preview - changes update instantly
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Replace the existing Embed Code Section with new tabbed version */}
      <div className="container mx-auto px-4 mt-10 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Embed Code</CardTitle>
            <p className="text-sm text-muted-foreground">Choose your preferred integration method</p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeIntegrationTab} onValueChange={setActiveIntegrationTab} className="mt-2">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="script">Script Tag</TabsTrigger>
                <TabsTrigger value="iframe">iFrame</TabsTrigger>
                <TabsTrigger value="react">React</TabsTrigger>
                <TabsTrigger value="vue">Vue</TabsTrigger>
              </TabsList>
              
              <TabsContent value="script" className="mt-4">
                <div className="space-y-2">
                  <Label>HTML Script Tag (Recommended)</Label>
                  <div className="relative bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto border">
                    <pre className="whitespace-pre-wrap break-all text-xs leading-6 select-all" tabIndex={0} style={{ minHeight: 48 }}>
                      {scriptCode}
                    </pre>
                    <div className="absolute top-2 right-2">
                      <CopyButton value={scriptCode} size="sm" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Pro tip:</strong> Place this before your <code>&lt;/body&gt;</code> tag for best performance. You can customize the <code>data-position</code> and <code>data-primary-color</code> attributes as needed.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="iframe" className="mt-4">
                <div className="space-y-2">
                  <Label>iFrame Embed</Label>
                  <div className="relative bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto border">
                    <pre className="whitespace-pre-wrap break-all text-xs leading-6 select-all" tabIndex={0} style={{ minHeight: 48 }}>
                      {iframeCode}
                    </pre>
                    <div className="absolute top-2 right-2">
                      <CopyButton value={iframeCode} size="sm" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this if you want to embed the chat in a fixed container on your page.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="react" className="mt-4">
                <div className="space-y-2">
                  <Label>React Component</Label>
                  <div className="relative bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto border">
                    <pre className="whitespace-pre-wrap break-all text-xs leading-6 select-all" tabIndex={0} style={{ minHeight: 48 }}>
                      {reactCode}
                    </pre>
                    <div className="absolute top-2 right-2">
                      <CopyButton value={reactCode} size="sm" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <code className="text-sm bg-muted rounded px-2 py-1">npm install @attiy/react</code>
                    <CopyButton value="npm install @attiy/react" variant="secondary" size="sm" />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="vue" className="mt-4">
                <div className="space-y-2">
                  <Label>Vue Component</Label>
                  <div className="relative bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto border">
                    <pre className="whitespace-pre-wrap break-all text-xs leading-6 select-all" tabIndex={0} style={{ minHeight: 48 }}>
                      {vueCode}
                    </pre>
                    <div className="absolute top-2 right-2">
                      <CopyButton value={vueCode} size="sm" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <code className="text-sm bg-muted rounded px-2 py-1">npm install @attiy/vue</code>
                    <CopyButton value="npm install @attiy/vue" variant="secondary" size="sm" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* API Usage Confirmation Dialog */}
      <Dialog open={showApiConfirmDialog} onOpenChange={setShowApiConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Real API for Testing?</DialogTitle>
            <DialogDescription>
              Using the real OpenAI API will incur costs based on your API key billing settings. Each message sent during testing will count toward your usage limits. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowApiConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApiUsage} variant="default" className="bg-blue-600 hover:bg-blue-700">
              I Understand, Use Real API
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 