import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: { port: 5173 },
    build: {
        // Warn only for genuinely large chunks after splitting
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined;

                    // React core (react, react-dom, router, scheduler)
                    if (
                        id.includes('react-dom') ||
                        id.includes('react-router') ||
                        id.includes('/react/') ||
                        id.includes('scheduler')
                    ) {
                        return 'vendor-react';
                    }
                    // Supabase client + dependencies
                    if (id.includes('@supabase')) {
                        return 'vendor-supabase';
                    }
                    // Charts — only used by Analytics
                    if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
                        return 'vendor-charts';
                    }
                    // Data layer + utilities
                    if (
                        id.includes('@tanstack/react-query') ||
                        id.includes('react-hot-toast') ||
                        id.includes('lucide-react') ||
                        id.includes('clsx')
                    ) {
                        return 'vendor-misc';
                    }
                    return undefined;
                },
            },
        },
    },
});
