import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import './index.css';
import { OrgProvider } from './lib/OrgContext';
import AppToaster from './components/AppToaster';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter
                    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
                >
                    <AuthProvider>
                        <OrgProvider>
                        <App />
                        <AppToaster />
                        </OrgProvider>
                    </AuthProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </ThemeProvider>
    </React.StrictMode>
);
