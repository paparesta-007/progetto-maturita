/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    // Modifica qui: diciamo a Tailwind di usare l'attributo data-theme
    darkMode: ['class', '[data-theme="dark"]'], 
    theme: {
        extend: {
            colors: {
                beige: {
                    DEFAULT: '#f0eee6',
                    light: '#fcfbf9',
                    dark: '#e3dnc2',
                    accent: '#cabfa5'
                }
            }
        },
    },
    plugins: [
        require('tailwind-scrollbar'),
    ],
}