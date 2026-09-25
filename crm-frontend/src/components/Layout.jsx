import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const location = useLocation();

    // Close the drawer whenever the route changes
    useEffect(() => {
        setDrawerOpen(false);
    }, [location.pathname]);

    // Prevent body scroll while drawer is open
    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [drawerOpen]);

    return (
        <div className="h-full flex flex-col">
            {/* Mobile top bar */}
            <header className="lg:hidden sticky top-0 z-30 glass border-b border-slate-200/80 dark:border-slate-800 safe-top">
                <div className="h-14 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition"
                            aria-label="Open menu"
                        >
                            <Menu size={22} />
                        </button>
                        <img src="./logo.svg" alt="CRM" className="h-7 dark:hidden" />
                        <img src="./logo-white.svg" alt="CRM" className="h-7 hidden dark:block" />
                    </div>
                </div>
                {drawerOpen && (
                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                )}
            </header>

            <div className="flex flex-1 min-h-0">
                {/* Desktop sidebar */}
                <div className="hidden lg:block shrink-0">
                    <Sidebar />
                </div>

                {/* Mobile drawer */}
                {drawerOpen && (
                    <div className="lg:hidden fixed inset-0 z-40">
                        <div
                            className="absolute inset-0 bg-slate-950/45 dark:bg-black/60 backdrop-blur-[2px] animate-overlay-in"
                            onClick={() => setDrawerOpen(false)}
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] shadow-pop dark:shadow-pop-dark animate-slide-in-left bg-white dark:bg-slate-900 rounded-r-2xl">
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="absolute top-3.5 right-3 z-10 p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                aria-label="Close menu"
                            >
                                <X size={18} />
                            </button>
                            <Sidebar onNavigate={() => setDrawerOpen(false)} className="!w-full border-r-0" />
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className="flex-1 overflow-y-auto min-w-0 page-bg">
                    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
                </main>
            </div>
        </div>
    );
}
