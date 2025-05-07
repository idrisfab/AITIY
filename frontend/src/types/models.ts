export interface ModelInfo {
  id: string;
  name: string;
  vendor: string;
  capabilities?: string[];
  contextWindow?: number;
  description?: string;
  category?: string;
  pricingTier?: string;
  deprecated?: boolean;
  defaultModel?: boolean;
} 