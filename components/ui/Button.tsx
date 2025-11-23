import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'dark' }> =
    ({ children, className = '', variant = 'primary', ...props }) => {

        const base = "px-6 py-3.5 rounded-full font-bold tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none text-sm";
        const variants = {
            // Primary: Neon Lime - The main call to action
            primary: "bg-brand text-black hover:bg-brand-hover shadow-neon border border-transparent",

            // Secondary: Dark Gray surface
            secondary: "bg-base-border text-white hover:bg-white/20 border border-transparent",

            // Outline: Thin border
            outline: "border border-base-border text-ink-gray hover:text-white hover:border-white bg-transparent",

            // Danger: Red
            danger: "bg-semantic-red/10 text-semantic-red hover:bg-semantic-red/20 border border-transparent",

            // Ghost: No bg
            ghost: "bg-transparent text-ink-gray hover:text-white hover:bg-white/5 px-4 border border-transparent",

            // Dark: Pure black
            dark: "bg-black text-white border border-base-border hover:border-brand"
        };

        return (
            <button className={`${base} ${variants[variant]} ${className}`} {...props}>
                {children}
            </button>
        );
    };
