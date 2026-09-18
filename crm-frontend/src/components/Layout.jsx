import Sidebar from './Sidebar';

export default function Layout({ children }) {
    return (
        <div className="flex h-full">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto p-6">{children}</div>
            </main>
        </div>
    );
}