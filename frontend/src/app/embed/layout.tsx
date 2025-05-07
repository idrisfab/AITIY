import '@/app/globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat Widget | AITIY',
  description: 'Embedded chat widget powered by AITIY',
};

// This is a special layout for the embed section
// It doesn't use the default RootLayout with providers
export default function EmbedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
