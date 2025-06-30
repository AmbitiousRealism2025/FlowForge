/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5B7FFF',
        subtext: '#6E7A8A',
        background: '#FFFFFF',
        card: '#F8F9FA',
        text: '#1A1A1A',
        border: '#E5E9EF',
        shadow: '#000000', // Placeholder for shadow color, actual shadows use utilities
        // secondary from colors.ts is not in the prompt, but good to have
        secondary: '#FF9D7A',
        success: '#4CAF50',
        error: '#F44336',
      }
    },
  },
  plugins: [],
}
