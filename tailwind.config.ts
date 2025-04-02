import forms from '@tailwindcss/forms';
import flowbitePlugin from 'flowbite/plugin';
// TODO: stwui は事実上開発が終了したと思われるため、別のライブラリに移行
import stwuiPlugin from 'stwui/plugin';

import type { Config } from 'tailwindcss';

const config = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/svelte-5-ui-lib/**/*.{html,js,svelte,ts}',
    './node_modules/stwui/**/*.{svelte,js,ts,html}',
  ],

  plugins: [forms, flowbitePlugin, stwuiPlugin],

  darkMode: 'selector',

  theme: {
    extend: {
      colors: {
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
          Q11: '#e4d3da',
          Q10: '#e3cad8',
          Q9: '#e4cde0',
          Q8: '#e4cbe8',
          Q7: '#d0afd6',
          Q6: '#d9afe5',
          Q5: '#f7cc52',
          Q4: '#f1dd72',
          Q3: '#c8e389',
          Q2: '#97d093',
          Q1: '#73d091',
          D1: '#1c85b6',
          D2: '#7f36be',
          D3: '#e68e2e',
          D4: '#e36223',
          D5: '#e60d00',
          D6: '#432414',
          gray: '',
          brown: '',
          green: '',
          cyan: '',
          blue: '',
          yellow: '',
          orange: '',
          red: '',
          bronze: '#e38a66',
          silver: '',
          gold: '',
          ns: '#ffffff',
          wa: {
            default: '#f0ad4e',
            hover: '#d97706',
            background: '#ffeeba',
            background_dark: '#91400f',
          },
          ac: {
            default: '#5cb85c',
            hover: '#449d44',
            background: '#c3e6cb',
            background_dark: '#09c12f',
            with_editorial: {
              default: '#00aeef',
              hover: '#21a0db',
              background: '#d7dcf5',
              background_dark: '#3abff8',
            },
          },
        },
      },
      screens: {
        xs: '420px',
      },
    },
  },
} as Config;

export default config;
