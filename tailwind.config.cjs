 /** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./frontend/src/**/*.{js,ts,jsx,tsx}", // Adicionei essa linha por segurança
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}