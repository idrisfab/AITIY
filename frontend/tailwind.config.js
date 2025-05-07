/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--border, #D3D3D3)',
        input: 'var(--input, #D3D3D3)',
        ring: 'var(--ring, #04AA6D)',
        background: 'var(--background, #F1F1F1)',
        foreground: 'var(--foreground, #333333)',
        primary: {
          DEFAULT: 'var(--primary, #282A35)',
          foreground: 'var(--primary-foreground, #FFFFFF)',
        },
        secondary: {
          DEFAULT: 'var(--secondary, #E7E7E7)',
          foreground: 'var(--secondary-foreground, #333333)',
        },
        destructive: {
          DEFAULT: 'var(--destructive, #FF5252)',
          foreground: 'var(--destructive-foreground, #FFFFFF)',
        },
        muted: {
          DEFAULT: 'var(--muted, #E7E7E7)',
          foreground: 'var(--muted-foreground, #666666)',
        },
        accent: {
          DEFAULT: 'var(--accent, #04AA6D)',
          foreground: 'var(--accent-foreground, #FFFFFF)',
        },
        popover: {
          DEFAULT: 'var(--popover, #FFFFFF)',
          foreground: 'var(--popover-foreground, #333333)',
        },
        card: {
          DEFAULT: 'var(--card, #FFFFFF)',
          foreground: 'var(--card-foreground, #333333)',
        },
      },
      borderRadius: {
        lg: `var(--radius, 0.5rem)`,
        md: `calc(var(--radius, 0.5rem) - 2px)`,
        sm: `calc(var(--radius, 0.5rem) - 4px)`,
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}; 