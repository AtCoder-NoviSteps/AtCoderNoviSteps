import forms from '@tailwindcss/forms';
import flowbitePlugin from 'flowbite/plugin';

import type { Config } from 'tailwindcss';

const config = {
  plugins: [forms, flowbitePlugin],

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
          Q11: '#e4e3e3',
          Q10: '#e4dfdc',
          Q9: '#dde3dc',
          Q8: '#dde7e7',
          Q7: '#dddceb',
          Q6: '#e8e7dc',
          Q5: '#dda0dd',
          Q4: '#da70d6',
          Q3: '#9370DB',
          Q2: '#7f6000',
          Q1: '#01fb02',
          D1: '#72C6ef',
          D2: '#002eff',
          D3: '#ffff02',
          D4: '#ff9900',
          D5: '#ff1000',
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
      width: {
        '1/7': '14.2857143%',
        '1/8': '12.5%',
        '1/9': '11.1111111%',
        '1/10': '10%',
      },
    },
  },
} as Config;

export default config;
