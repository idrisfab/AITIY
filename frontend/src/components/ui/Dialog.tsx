import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from './Tabs';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-800 dark:bg-gray-950 sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500 dark:ring-offset-gray-950 dark:focus:ring-gray-300 dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export interface DialogTabsProps extends React.ComponentPropsWithoutRef<typeof Tabs> {
  className?: string;
  children: React.ReactNode;
}

export function DialogTabs({ className, children, ...props }: DialogTabsProps) {
  return (
    <Tabs
      {...props}
      className={cn('w-full mb-6', className)}
    >
      <TabsList className="w-full grid grid-cols-4 rounded-xl p-1.5 bg-gray-50 border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
        {children}
      </TabsList>
    </Tabs>
  );
}

export function DialogTab({ children, ...props }: { children: React.ReactNode } & React.ComponentPropsWithoutRef<typeof TabsTrigger>) {
  return (
    <TabsTrigger 
      className="px-3 py-2.5 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400" 
      {...props}
    >
      {children}
    </TabsTrigger>
  );
}

export interface DialogAccordionProps {
  sections: {
    title: string;
    value: string;
    content: React.ReactNode;
  }[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function DialogAccordion({ sections, value, onValueChange, className }: DialogAccordionProps) {
  return (
    <div className={cn("w-full space-y-2 mb-6", className)}>
      {sections.map((section) => (
        <div key={section.value} className="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-800">
          <button
            type="button"
            onClick={() => onValueChange(section.value)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium transition-colors",
              value === section.value 
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
                : "bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
            )}
          >
            <span>{section.title}</span>
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
              className={cn(
                "transition-transform", 
                value === section.value ? "transform rotate-180" : ""
              )}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {value === section.value && (
            <div className="px-4 py-3 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}; 