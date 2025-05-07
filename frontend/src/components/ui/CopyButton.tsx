import { useState } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface CopyButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  value: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export function CopyButton({ value, className, variant = 'outline', size = 'default', ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={copy}
      className={cn('transition-all', className)}
      {...props}
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
} 