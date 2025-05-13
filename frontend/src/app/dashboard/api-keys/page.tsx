'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiKeys } from '@/utils/api';
import { vendors, type VendorId } from '@/utils/vendors';

interface ApiKey {
  id: string;
  vendor: VendorId;
  name: string;
  createdAt: string;
  apiKey?: string;
  usageCount?: number;
}

interface DeleteState {
  isOpen: boolean;
  keyToDelete: ApiKey | null;
  isLoading: boolean;
}

export default function ApiKeysPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorId>('openai');
  const [formData, setFormData] = useState({
    apiKey: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationStatus, setValidationStatus] = useState<'none' | 'success' | 'error'>('none');
  const [deleteState, setDeleteState] = useState<DeleteState>({
    isOpen: false,
    keyToDelete: null,
    isLoading: false,
  });
  const [lastDeletedKey, setLastDeletedKey] = useState<ApiKey | null>(null);

  // Load existing API keys
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const data = await apiKeys.list();
      setKeys(data);
    } catch (error: any) {
      toast.error('Failed to load API keys');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const vendor = vendors[selectedVendor];
    
    if (!formData.apiKey) {
      newErrors.apiKey = 'API key is required';
    } else if (!vendor.keyPattern.test(formData.apiKey)) {
      newErrors.apiKey = `${vendor.name} API keys must start with "${vendor.keyPrefix}"`;
    }
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestKey = async () => {
    if (!formData.apiKey) {
      setErrors(prev => ({ ...prev, apiKey: 'API key is required' }));
      return;
    }

    setIsValidating(true);
    setValidationStatus('none');
    try {
      const validation = await vendors[selectedVendor].validateKey(formData.apiKey);
      if (validation.isValid) {
        setValidationStatus('success');
        toast.success('API key is valid!');
        setErrors(prev => ({ ...prev, apiKey: '' }));
      } else {
        setValidationStatus('error');
        setErrors(prev => ({ 
          ...prev, 
          apiKey: validation.error || 'Invalid API key'
        }));
      }
    } catch (error: any) {
      setValidationStatus('error');
      setErrors(prev => ({ 
        ...prev, 
        apiKey: 'Failed to validate API key'
      }));
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // First validate the API key if not already validated
      if (validationStatus !== 'success') {
        const validation = await vendors[selectedVendor].validateKey(formData.apiKey);
        if (!validation.isValid) {
          setErrors(prev => ({ 
            ...prev, 
            apiKey: validation.error || 'Invalid API key' 
          }));
          return;
        }
      }

      // If validation passes, create the API key
      await apiKeys.create({
        vendor: selectedVendor,
        apiKey: formData.apiKey,
        name: formData.name,
      });
      
      toast.success('API key added successfully');
      setFormData({ apiKey: '', name: '' });
      setValidationStatus('none');
      loadApiKeys();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add API key';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (key: ApiKey) => {
    setDeleteState({
      isOpen: true,
      keyToDelete: key,
      isLoading: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteState.keyToDelete) return;

    setDeleteState(prev => ({ ...prev, isLoading: true }));
    try {
      await apiKeys.delete(deleteState.keyToDelete.id);
      
      // Store the deleted key for potential undo
      setLastDeletedKey(deleteState.keyToDelete);
      
      // Show success toast with undo button
      toast((t) => (
        <div className="flex items-center gap-2">
          <span>API key deleted</span>
          <button
            className="text-indigo-600 hover:text-indigo-500 font-medium"
            onClick={() => {
              handleUndo();
              toast.dismiss(t.id);
            }}
          >
            Undo
          </button>
        </div>
      ), { duration: 5000 });

      loadApiKeys();
    } catch (error: any) {
      toast.error('Failed to delete API key');
    } finally {
      setDeleteState({
        isOpen: false,
        keyToDelete: null,
        isLoading: false,
      });
    }
  };

  const handleUndo = async () => {
    if (!lastDeletedKey || !lastDeletedKey.apiKey) {
      toast.error('Cannot restore API key - key data not available');
      return;
    }

    try {
      await apiKeys.create({
        vendor: lastDeletedKey.vendor,
        apiKey: lastDeletedKey.apiKey,
        name: lastDeletedKey.name,
      });
      toast.success('API key restored');
      loadApiKeys();
    } catch (error: any) {
      toast.error('Failed to restore API key');
    } finally {
      setLastDeletedKey(null);
    }
  };

  const getValidationStatusIcon = () => {
    if (validationStatus === 'success') {
      return (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (validationStatus === 'error') {
      return (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            API Keys
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your AI vendor API keys for chat embeds
          </p>
        </div>
      </div>

      <div className="mt-8 max-w-3xl space-y-6">
        {/* Add new API key form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Add API Key
            </h3>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Add your AI vendor API key to power your chat embeds. Your key will be encrypted before storage.
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Vendor Selection */}
              <div className="grid grid-cols-3 gap-4">
                {Object.values(vendors).map((vendor) => (
                  <button
                    key={vendor.id}
                    type="button"
                    onClick={() => setSelectedVendor(vendor.id)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all duration-200
                      ${selectedVendor === vendor.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
                      }
                    `}
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">{vendor.name}</h4>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{vendor.description}</p>
                  </button>
                ))}
              </div>

              <Input
                label="API Key Name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                error={errors.name}
                placeholder={`e.g., Production ${vendors[selectedVendor].name} Key`}
                disabled={isLoading}
                required
                className="transition-all duration-200 focus:scale-[1.01]"
              />
              <div className="relative">
                <Input
                  label={`${vendors[selectedVendor].name} API Key`}
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, apiKey: e.target.value }));
                    if (errors.apiKey) setErrors(prev => ({ ...prev, apiKey: '' }));
                    setValidationStatus('none');
                  }}
                  error={errors.apiKey}
                  placeholder={`${vendors[selectedVendor].keyPrefix}...`}
                  helperText={
                    <div className="flex items-center space-x-1">
                      <span>Your API key will be encrypted before storage.</span>
                      <button
                        type="button"
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium transition-colors"
                        onClick={() => window.open(vendors[selectedVendor].docsUrl, '_blank')}
                      >
                        Get your API key
                      </button>
                    </div>
                  }
                  disabled={isLoading || isValidating}
                  required
                  className="transition-all duration-200 focus:scale-[1.01]"
                />
                <div className="absolute right-3 top-[34px] transition-all duration-200">
                  {getValidationStatusIcon()}
                </div>
              </div>
              <div className="flex space-x-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestKey}
                  isLoading={isValidating}
                  disabled={isLoading || !formData.apiKey}
                  className="flex-1 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isValidating ? 'Testing...' : 'Test Key'}
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={isValidating || validationStatus === 'error'}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? 'Adding...' : 'Add API Key'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* List of API keys */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Your API Keys
            </h3>
            <div className="mt-4">
              {keys.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No API keys</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first API key.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {keys.map((key) => (
                    <li key={key.id} className="py-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                      <div className="flex items-center justify-between px-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {key.name}
                            </h4>
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              {vendors[key.vendor]?.name || key.vendor}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Added {new Date(key.createdAt).toLocaleDateString()}
                          </p>
                          {key.usageCount !== undefined && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Usage: {key.usageCount} calls
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(key)}
                          className="text-gray-600 hover:text-red-600 transition-all duration-200"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteState.isOpen}
        onClose={() => setDeleteState(prev => ({ ...prev, isOpen: false }))}
        title="Delete API Key"
        description={`Are you sure you want to delete "${deleteState.keyToDelete?.name}"? This action cannot be undone.`}
        actionButton={{
          label: 'Delete',
          onClick: confirmDelete,
          variant: 'destructive',
          isLoading: deleteState.isLoading,
        }}
      />
    </div>
  );
} 