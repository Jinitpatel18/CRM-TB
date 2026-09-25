/**
 * Idle-time prefetching.
 *
 * Downloads page chunks while the browser is idle (after first paint)
 * so later navigation feels instant — without slowing the initial load.
 *
 * The dynamic imports below reference the SAME modules that App.jsx
 * lazy-loads, so Vite emits them as identical chunks and the browser
 * simply fills its cache.
 */

let prefetched = false;

function onIdle(fn) {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(fn, { timeout: 4000 });
    } else {
        setTimeout(fn, 1500);
    }
}

/**
 * Prefetch the chunks for the pages a signed-in user is most likely
 * to visit right after the dashboard.
 */
export function prefetchCorePages() {
    if (prefetched) return;
    prefetched = true;

    onIdle(() => {
        const tasks = [
            () => import('../pages/Companies.jsx'),
            () => import('../pages/SendMessage.jsx'),
            () => import('../pages/Queue.jsx'),
        ];
        tasks.forEach((task) => {
            Promise.resolve()
                .then(task)
                .catch(() => {
                    /* prefetch is best-effort; ignore failures */
                });
        });
    });
}

/**
 * Prefetch a page chunk on hover/focus of a link (advanced usage).
 * import('..') is called lazily so nothing loads until the event fires.
 */
export function prefetchOnHover(loader) {
    return () => {
        Promise.resolve()
            .then(loader)
            .catch(() => {
                /* ignore */
            });
    };
}
