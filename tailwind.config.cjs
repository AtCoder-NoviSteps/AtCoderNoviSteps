const config = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte-icons/**/*.{html,js,svelte,ts}',
  ],

  plugins: [require('flowbite/plugin')],

  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        // flowbite-svelte
        primary: {
          50: '#FFF5F2',
          100: '#FFF1EE',
          200: '#FFE4DE',
          300: '#FFD5CC',
          400: '#FFBCAD',
          500: '#FE795D',
          600: '#EF562F',
          700: '#EB4F27',
          800: '#CC4522',
          900: '#A5371B',
        },
        atcoder: {
          Q11: '#f3f3f3',
          Q10: '#f3f3f3',
          Q9: '#efefef',
          Q8: '#d9d9d9',
          Q7: '#cccccc',
          Q6: '#b7b7b7',
          Q5: '#999999',
          Q4: '#666666',
          Q3: '#741b47',
          Q2: '#7f6000',
          Q1: '#00ff00',
          D1: '#a4c2f4',
          D2: '#6d9eeb',
          D3: '#ffff00',
          D4: '#ff9900',
          D5: '#ff0000',
          D6: '#cc0000',
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
        },
      },
    },
  },
};

module.exports = config;
