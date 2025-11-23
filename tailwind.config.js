/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#C6FF3F', // Neon Lime from index.css glow
                    hover: '#D4FF70',   // Slightly lighter for hover
                },
                base: {
                    card: '#111111',    // Dark background for cards
                    border: 'rgba(255, 255, 255, 0.1)', // Subtle border
                    hover: 'rgba(255, 255, 255, 0.05)', // Hover state
                },
                semantic: {
                    blue: '#60A5FA',   // Bright Blue
                    green: '#4ADE80',  // Bright Green
                    purple: '#C084FC', // Bright Purple
                    red: '#F87171',    // Bright Red
                    yellow: '#FACC15', // Bright Yellow
                },
                ink: {
                    gray: '#9CA3AF',   // Light Gray
                    dim: '#6B7280',    // Dim Gray
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
