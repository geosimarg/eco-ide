import { invoke } from '@tauri-apps/api/core';

const isDev = import.meta.env.DEV;
let logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent' = isDev ? 'info' : 'silent';

export function setLogLevel(level: typeof logLevel) {
    logLevel = level;
}

function shouldLog(level: string): boolean {
    if (logLevel === 'silent') return false;
    const levels = ['error', 'warn', 'info', 'debug', 'trace'];
    return levels.indexOf(level) <= levels.indexOf(logLevel);
}

async function writeToBackend(level: string, context: string, message: string) {
    try {
        await invoke('write_log', { level, context, message });
    } catch { /* suppressed */ }
}

function formatMessage(a1: string | unknown, a2?: string | unknown): { context: string; message: string } {
    if (a2 === undefined) {
        return { context: 'app', message: String(a1) };
    }
    if (typeof a2 === 'string') {
        if (typeof a1 === 'string' && a1.startsWith('[')) {
            return { context: 'app', message: String(a1) + ' ' + a2 };
        }
        return { context: String(a1), message: a2 };
    }
    return { context: 'app', message: String(a1) + ' ' + String(a2) };
}

export const logger = {
    trace: (a1: string | unknown, a2?: string | unknown) => {
        if (!shouldLog('trace')) return;
        const { context, message } = formatMessage(a1, a2);
        writeToBackend('trace', context, message);
    },
    debug: (a1: string | unknown, a2?: string | unknown) => {
        if (!shouldLog('debug')) return;
        const { context, message } = formatMessage(a1, a2);
        writeToBackend('debug', context, message);
    },
    log: (a1: string | unknown, a2?: string | unknown) => {
        if (!shouldLog('info')) return;
        const { context, message } = formatMessage(a1, a2);
        writeToBackend('info', context, message);
    },
    info: (a1: string | unknown, a2?: string | unknown) => {
        if (!shouldLog('info')) return;
        const { context, message } = formatMessage(a1, a2);
        writeToBackend('info', context, message);
    },
    warn: (a1: string | unknown, a2?: string | unknown) => {
        if (!shouldLog('warn')) return;
        const { context, message } = formatMessage(a1, a2);
        writeToBackend('warn', context, message);
    },
    error: (a1: string | unknown, a2?: string | unknown) => {
        if (!shouldLog('error')) return;
        const { context, message } = formatMessage(a1, a2);
        writeToBackend('error', context, message);
    },
};

export function createLogger(context: string) {
    return {
        trace: (message: string, ..._args: unknown[]) => logger.trace(context, message),
        debug: (message: string, ..._args: unknown[]) => logger.debug(context, message),
        log: (message: string, ..._args: unknown[]) => logger.log(context, message),
        info: (message: string, ..._args: unknown[]) => logger.info(context, message),
        warn: (message: string, ..._args: unknown[]) => logger.warn(context, message),
        error: (message: string, ..._args: unknown[]) => logger.error(context, message),
    };
}