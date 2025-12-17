/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            screens: {
                'xs': '375px',
                'sm': '640px',
                'md': '768px',
                'lg': '1024px',
                'xl': '1280px',
            },
            spacing: {
                'touch': '44px', // Minimum touch target (Apple/Google guidelines)
                'touch-sm': '40px', // Slightly smaller touch target
            },
            fontSize: {
                'mobile-xs': ['12px', { lineHeight: '16px' }],
                'mobile-sm': ['14px', { lineHeight: '20px' }],
                'mobile-base': ['16px', { lineHeight: '24px' }],
                'mobile-lg': ['18px', { lineHeight: '28px' }],
            },
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
