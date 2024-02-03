const config = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte-icons/**/*.{html,js,svelte,ts}',
    './node_modules/stwui/**/*.{svelte,js,ts,html}',
  ],

  plugins: [require('@tailwindcss/forms'), require('flowbite/plugin'), require('stwui/plugin')],

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
          },
          ac: {
            default: '#5cb85c',
            hover: '#449d44',
            with_editorial: {
              default: '#00aeef',
              hover: '#21a0db',
            },
          },
        },
      },
    },
  },
};

module.exports = config;
