import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

export default function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                text-slate-500 dark:text-slate-400
                hover:bg-slate-100 hover:text-slate-700
                dark:hover:bg-slate-800 dark:hover:text-slate-200 ${className}`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
    );
}
