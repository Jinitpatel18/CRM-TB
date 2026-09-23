import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
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
            <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 safe-top">
                <div className="h-14 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                            aria-label="Open menu"
                        >
                            <Menu size={22} />
                        </button>
                        <span className="font-bold text-brand-600 text-lg">CRM</span>
                    </div>
                </div>
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
                            className="absolute inset-0 bg-black/40 animate-overlay-in"
                            onClick={() => setDrawerOpen(false)}
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] shadow-2xl animate-slide-in-left bg-white">
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="absolute top-3 right-3 z-10 p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                                aria-label="Close menu"
                            >
                                ✕
                            </button>
                            <Sidebar onNavigate={() => setDrawerOpen(false)} className="!w-full border-r-0" />
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className="flex-1 overflow-y-auto min-w-0">
                    <div className="max-w-6xl mx-auto p-4 sm:p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
