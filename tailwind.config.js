import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte-icons/**/*.{html,js,svelte,ts}',
    './node_modules/stwui/**/*.{svelte,js,ts,html}',
  ],
  plugins: [require('@tailwindcss/forms'), require('flowbite/plugin'), require('stwui/plugin')],
  safelist: ['dark'],
  theme: {
    container: {
      center: true,
      screens: {
        '2xl': '1560px',
      },
    },
    extend: {
      colors: {
        // shadcn-svelte
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        // TODO: Replace from flowbite-svelte to shadcn-svelte
        // primary: {
        //   DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
        //   foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        // },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },

        // flowbite-svelte
        primary: {
          50: '#eaf6f0',
          100: '#d2ecdf',
          200: '#bbe1ce',
          300: '#a3d7bd',
          400: '#8bcdac',
          500: '#74c29b',
          600: '#5cb88a',
          700: '#44ae79',
          800: '#2da368',
          900: '#159957',
        },
        atcoder: {
          Q11: '#e4e3e3',
          Q10: '#e4dfdc',
          Q9: '#dde3dc',
          Q8: '#dde7e7',
          Q7: '#dddceb',
          Q6: '#e8e7dc',
          Q5: '#ece3dc',
          Q4: '#ecdcdc',
          Q3: '#741b47',
          Q2: '#7f6000',
          Q1: '#01fb02',
          D1: '#72C6ef',
          D2: '#002eff',
          D3: '#ffff02',
          D4: '#ff9900',
          D5: '#ff1000',
          D6: '#cc0A00',
          gray: '',
          brown: '',
          green: '',
          cyan: '',
          blue: '',
          yellow: '',
          orange: '',
          red: '',
          bronze: '',
          silver: '',
          gold: '',
          ns: '#ffffff',
          wa: {
            default: '#f0ad4e',
            hover: '#d97706',
            background: '#ffeeba',
          },
          ac: {
            default: '#5cb85c',
            hover: '#449d44',
            background: '#c3e6cb',
            with_editorial: {
              default: '#00aeef',
              hover: '#21a0db',
              background: '#d7dcf5',
            },
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: [...fontFamily.sans],
      },
    },
  },
};

export default config;
