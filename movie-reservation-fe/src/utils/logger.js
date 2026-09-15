/**
 * Centralized logging utility.
 * Dễ dàng tích hợp với Sentry, LogRocket, Datadog sau này.
 */
export const logger = {
    info: (message, ...args) => {
        if (import.meta.env.DEV) {
            console.log(`[INFO] ${message}`, ...args);
        }
    },
    warn: (message, ...args) => {
        if (import.meta.env.DEV) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },
    error: (message, error, ...args) => {
        // TODO: Send to remote error tracking service (e.g. Sentry)
        console.error(`[ERROR] ${message}`, error, ...args);
    }
};
