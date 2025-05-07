'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { auth } from '@/utils/api';
import Cookies from 'js-cookie';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if redirected from registration or email verification
  React.useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      toast.success('Email verified! You can now log in.');
    }
  }, [searchParams]);

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
    if (!formData.email) {
      newErrors.email = 'Email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const data = await auth.login(formData);
      
      // Store token in both localStorage and cookies
      localStorage.setItem('token', data.token);
      // Set cookie with same-site attribute and secure flag
      Cookies.set('token', data.token, { 
        expires: 7, 
        sameSite: 'Lax',
        secure: window.location.protocol === 'https:' 
      });
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Show success message
      toast.success('Login successful!');
      
      // Force a page reload to ensure all auth state is fresh
      window.location.href = '/dashboard';
    } catch (error: any) {
      // Handle login failure
      const errorMessage = error.response?.data?.error || 'Failed to login';
      toast.error(errorMessage);
      
      // Clear password field on error
      setFormData((prev) => ({ ...prev, password: '' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="Enter your email"
        disabled={isLoading}
        autoComplete="username"
        required
      />
      <Input
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        placeholder="Enter your password"
        disabled={isLoading}
        autoComplete="current-password"
        required
      />
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Forgot your password?
          </button>
        </div>
      </div>
      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
      <div className="text-center text-sm">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/auth/register')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Sign up
        </button>
      </div>
    </form>
  );
} 