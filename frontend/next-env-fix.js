// This file helps fix React context issues during build time
// It's used to mock React context providers during static site generation

// Mock implementation of React's useContext
if (typeof window === 'undefined') {
  // Only run this code during server-side rendering
  const React = require('react');
  const originalUseContext = React.useContext;
  
  // Override useContext to provide default values when context is null
  React.useContext = function mockUseContext(Context) {
    try {
      return originalUseContext(Context);
    } catch (error) {
      // Return a default empty context object when the real context is not available
      console.warn('Context not available during SSG, using mock');
      return {};
    }
  };
}
