import React from 'react';

export const Avatar: React.FC<{ name: string; src?: string; className?: string }> = ({ name, src, className = '' }) => {
    const safeName = name || 'F L';
    const initials = safeName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    // Generative gradient based on name length
    const colors = [
        'from-semantic-blue to-semantic-purple',
        'from-brand to-semantic-green',
        'from-semantic-yellow to-semantic-red',
        'from-purple-500 to-pink-500',
    ];
    const gradient = colors[safeName.length % colors.length];

    if (src) {
        return (
            <div className={`w-10 h-10 rounded-full overflow-hidden bg-black border border-white/10 shadow-lg ${className}`}>
                <img src={src} alt={name} className="w-full h-full object-cover" />
            </div>
        )
    }

    return (
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-black text-black shadow-lg ${className}`}>
            {initials}
        </div>
    );
};
