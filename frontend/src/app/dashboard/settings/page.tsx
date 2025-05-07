'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { user as userApi } from '@/utils/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';

interface ProfileFormData {
  name: string;
  email: string;
}

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Make API call to update profile
      const response = await userApi.updateProfile(formData);
      
      // Update local storage with new user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...userData, ...response.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success(response.message || 'Profile updated successfully');
      
      // If email was changed, show a notification about verification
      if (response.user.email !== user?.email) {
        toast.success('Please check your email to verify your new address');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
      
      // If email already exists
      if (errorMessage.includes('email') && errorMessage.includes('exists')) {
        setErrors((prev) => ({ ...prev, email: 'This email is already in use' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <PageHeader 
        title="Account Settings"
        description="Update your account information and preferences"
      />

      <div className="mt-8 space-y-8">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and how we can reach you.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                disabled={isLoading}
                required
                className="dark:text-gray-100"
              />
              <Input
                label="Email Address"
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                disabled={isLoading || (user?.emailVerified && formData.email === user.email)}
                required
                helperText={user?.emailVerified && formData.email === user.email ? 
                  "Your email is verified. Contact support if you need to change it." : 
                  "Changing your email will require verification of the new address."
                }
                className="dark:text-gray-100"
              />
            </CardContent>
            <CardFooter className="border-t dark:border-gray-700 pt-6">
              <Button
                type="submit"
                isLoading={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              type="button"
              onClick={() => window.location.href = '/dashboard/settings/change-password'}
            >
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Details about your account status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account created</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email verification</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                  {user?.emailVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Not verified
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-red-500 dark:border-red-700">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-500">Danger Zone</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Once you delete your account, there is no going back. Please be certain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  // Handle account deletion
                  toast.error('Account deletion is not yet implemented.');
                }
              }}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 