const isDev = import.meta.env.DEV;
let logLevel: 'error' | 'warn' | 'info' | 'debug' | 'silent' = isDev ? 'warn' : 'silent';

export function setLogLevel(level: typeof logLevel) {
    logLevel = level;
}

function shouldLog(level: string): boolean {
    if (logLevel === 'silent') return false;
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(logLevel);
}

export const logger = {
    log: (...args: unknown[]) => {
        if (shouldLog('info')) console.log(...args);
    },
    error: (...args: unknown[]) => {
        if (shouldLog('error')) console.error(...args);
    },
    warn: (...args: unknown[]) => {
        if (shouldLog('warn')) console.warn(...args);
    },
    info: (...args: unknown[]) => {
        if (shouldLog('info')) console.info(...args);
    },
    debug: (...args: unknown[]) => {
        if (shouldLog('debug')) console.debug(...args);
    },
};
