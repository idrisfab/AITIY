'use client';

import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/Select';
import { fetchUserApiKeys } from '@/lib/api';
import type { ApiKey } from '@/types/api-key';
import { Label } from '@/components/ui/Label';

interface ApiKeySelectProps {
  value: string;
  onChange: (value: string) => void;
  vendor?: string;
}

export function ApiKeySelect({ value, onChange, vendor }: ApiKeySelectProps) {
  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: fetchUserApiKeys,
  });

  // Only filter by vendor if one is explicitly provided
  const filteredKeys = vendor ? apiKeys.filter(key => key.vendor === vendor) : apiKeys;
  
  // Group API keys by vendor for better organization
  const groupedKeys = filteredKeys.reduce((acc, key) => {
    const vendorName = key.vendor.charAt(0).toUpperCase() + key.vendor.slice(1); // Capitalize vendor name
    if (!acc[vendorName]) {
      acc[vendorName] = [];
    }
    acc[vendorName].push(key);
    return acc;
  }, {} as Record<string, ApiKey[]>);

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? 'Loading...' : 'Select an API key'} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedKeys).map(([vendorName, keys]) => (
          <SelectGroup key={vendorName}>
            <Label className="px-2 py-1.5 text-xs font-semibold text-gray-500">{vendorName}</Label>
            {keys.map((key) => (
              <SelectItem key={key.id} value={key.id}>
                {key.name || `${key.vendor} Key (${key.id.slice(0, 8)})`}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
        {!isLoading && filteredKeys.length === 0 && (
          <div className="p-2 text-sm text-gray-500">
            {vendor ? `No ${vendor} API keys found.` : 'No API keys found.'} Please add one in the API Keys section.
          </div>
        )}
      </SelectContent>
    </Select>
  );
} 