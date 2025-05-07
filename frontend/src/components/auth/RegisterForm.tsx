'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { auth } from '@/utils/api';
import Cookies from 'js-cookie';

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const data = await auth.register(formData);
      
      // Store token in both localStorage and cookies
      localStorage.setItem('token', data.token);
      // Set cookie with same-site attribute and 7-day expiration
      Cookies.set('token', data.token, { expires: 7, sameSite: 'Lax' });
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Show success message
      toast.success('Registration successful! Please check your email to verify your account.');
      
      // Redirect to login page
      router.push('/auth/login');
    } catch (error: any) {
      if (error.response?.data?.error === 'User already exists') {
        toast.error('An account with this email already exists');
        setErrors((prev) => ({ ...prev, email: 'An account with this email already exists' }));
      } else {
        // Handle general error
        const errorMessage = error.response?.data?.error || 'Failed to register';
        toast.error(errorMessage);
      }
      
      // Clear password on error
      setFormData((prev) => ({ ...prev, password: '' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="Enter your name"
        disabled={isLoading}
        autoComplete="name"
        required
      />
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
        autoComplete="new-password"
        required
      />
      <div className="text-sm text-gray-600">
        Password must be at least 6 characters long.
      </div>
      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
      >
        {isLoading ? 'Creating Account...' : 'Register'}
      </Button>
      <div className="text-center text-sm">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Log in
        </button>
      </div>
    </form>
  );
} 