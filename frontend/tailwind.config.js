/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sus: {
          primary: '#005CA9',    // Azul Oficial do SUS
          dark: '#003E70',       // Azul Marinho Institucional
          light: '#EBF5FB',      // Fundo suave de cards
          green: '#008853',      // Verde Saúde (confirmações, sucesso)
          'green-light': '#E8F5E9',
          amber: '#D97706',      // Alertas
          red: '#DC2626',        // Erros, cancelamentos
          gray: '#F8FAFC',       // Fundo geral do app
          border: '#E2E8F0',     // Bordas sutis
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
