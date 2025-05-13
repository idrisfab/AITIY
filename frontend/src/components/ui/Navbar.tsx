'use client';

import Link from 'next/link';
import { Button } from './Button';

export function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                AITIY
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="info" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 