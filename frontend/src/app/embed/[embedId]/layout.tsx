import '@/app/globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat Widget | AITIY',
  description: 'Embedded chat widget powered by AITIY',
};

// This special layout is used for the embed iframe
// We need to detect if we're in an iframe to avoid duplicate html/body tags
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Using a div as the root element to avoid nesting html/body tags
  // when this is loaded in an iframe
  return <>{children}</>;
} 