export type ThemeMode = 'light' | 'dark' | 'system';

export interface FontConfig {
  family: string;
  weight: number;
  size: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  error: string;
  success: string;
}

export interface BrandingConfig {
  logo?: string;
  showPoweredBy: boolean;
  customCss?: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    light: ColorScheme;
    dark: ColorScheme;
  };
  fonts: {
    heading: FontConfig;
    body: FontConfig;
  };
  branding: BrandingConfig;
  borderRadius: string;
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

export const defaultTheme: ThemeConfig = {
  mode: 'system',
  colors: {
    light: {
      primary: '#4F46E5',
      secondary: '#6366F1',
      accent: '#818CF8',
      background: '#FFFFFF',
      text: '#111827',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#10B981'
    },
    dark: {
      primary: '#6366F1',
      secondary: '#818CF8',
      accent: '#A5B4FC',
      background: '#111827',
      text: '#F9FAFB',
      border: '#374151',
      error: '#F87171',
      success: '#34D399'
    }
  },
  fonts: {
    heading: {
      family: 'Inter',
      weight: 600,
      size: '1.125rem'
    },
    body: {
      family: 'Inter',
      weight: 400,
      size: '1rem'
    }
  },
  branding: {
    showPoweredBy: true
  },
  borderRadius: '0.5rem',
  shadows: {
    small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    large: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
  }
}; 