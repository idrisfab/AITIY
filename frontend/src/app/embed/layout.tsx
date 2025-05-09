import '@/app/globals.css';
import { Metadata } from 'next';
import { EmbedProvider } from '@/providers/EmbedProvider';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chat Widget | AITIY',
  description: 'Embedded chat widget powered by AITIY',
};

// This is a special layout for the embed section
// It doesn't use the default RootLayout with providers that require authentication
export default function EmbedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <EmbedProvider>
          {children}
          <Toaster position="top-right" />
        </EmbedProvider>
      </body>
    </html>
  );
}
