import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/providers/AuthProvider';
import { TeamProvider } from '@/providers/TeamProvider';
import { QueryProvider } from '@/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Chat Embed Platform',
  description: 'Create and embed AI-powered chat widgets on your website',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <TeamProvider>
              {children}
              <Toaster position="top-right" />
            </TeamProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
