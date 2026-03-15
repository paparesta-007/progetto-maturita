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
                'primary-beige': {
                    DEFAULT: '#f0eee6', // Genera le classi base: bg-primary-beige, text-primary-beige...
                    dark: '#e3dacc'     // Genera le classi scure: bg-primary-beige-dark, text-primary-beige-dark...
                }
            }
        },
    },
    plugins: [
        require('tailwind-scrollbar'),
    ],
}