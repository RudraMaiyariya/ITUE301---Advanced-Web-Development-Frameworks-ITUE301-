import { lazy } from 'react';

/**
 * lazyWithDelay - Supplementary Problem 2
 * Wraps dynamic import with a guaranteed minimum delay (default 300ms)
 * to avoid flashing/flickering loading spinners on fast network connections.
 * 
 * @param {Function} importFunc - Dynamic import factory e.g. () => import('./Component')
 * @param {number} minDelay - Minimum time in milliseconds the fallback should remain visible
 */
export function lazyWithDelay(importFunc, minDelay = 300) {
    return lazy(() =>
        Promise.all([
            importFunc(),
            new Promise((resolve) => setTimeout(resolve, minDelay))
        ]).then(([moduleExports]) => moduleExports)
    );
}

export default lazyWithDelay;
