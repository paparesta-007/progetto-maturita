/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    // Modifica qui: diciamo a Tailwind di usare l'attributo data-theme
    darkMode: ['class', '[data-theme="dark"]'], 
    theme: {
        extend: {},
    },
    plugins: [
        require('tailwind-scrollbar'),
    ],
}