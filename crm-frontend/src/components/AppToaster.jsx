import { Toaster } from 'react-hot-toast';
import { useTheme } from '../lib/ThemeContext';

export default function AppToaster() {
    const { theme } = useTheme();
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                style: {
                    background: theme === 'dark' ? '#1e293b' : '#ffffff',
                    color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                    border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                    boxShadow: '0 4px 12px -2px rgb(15 23 42 / 0.15)',
                    borderRadius: '12px',
                    fontSize: '14px',
                },
            }}
        />
    );
}
