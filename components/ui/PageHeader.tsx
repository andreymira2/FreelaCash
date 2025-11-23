import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    backUrl?: string;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, backUrl, className = '' }) => {
    const navigate = useNavigate();

    return (
        <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500 ${className}`}>
            <div className="flex items-center gap-4">
                {backUrl && (
                    <Button
                        variant="dark"
                        onClick={() => navigate(backUrl)}
                        className="w-10 h-10 rounded-full p-0 flex items-center justify-center shadow-lg shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                )}
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">{title}</h1>
                    {subtitle && <p className="text-ink-gray font-medium mt-1">{subtitle}</p>}
                </div>
            </div>
            {action && (
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {action}
                </div>
            )}
        </header>
    );
};
