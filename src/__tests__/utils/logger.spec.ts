import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log'),
      error: vi.spyOn(console, 'error'),
      warn: vi.spyOn(console, 'warn'),
      info: vi.spyOn(console, 'info'),
      debug: vi.spyOn(console, 'debug'),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('in development mode', () => {
    it('should call console.log for log', async () => {
      const { logger } = await import('@/utils/logger');
      logger.log('test message');
      expect(consoleSpy.log).toHaveBeenCalledWith('test message');
    });

    it('should call console.error for error', async () => {
      const { logger } = await import('@/utils/logger');
      logger.error('error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('error message');
    });

    it('should call console.warn for warn', async () => {
      const { logger } = await import('@/utils/logger');
      logger.warn('warn message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('warn message');
    });

    it('should call console.info for info', async () => {
      const { logger } = await import('@/utils/logger');
      logger.info('info message');
      expect(consoleSpy.info).toHaveBeenCalledWith('info message');
    });

    it('should call console.debug for debug', async () => {
      const { logger } = await import('@/utils/logger');
      logger.debug('debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith('debug message');
    });

    it('should pass message', async () => {
      const { logger } = await import('@/utils/logger');
      logger.log('test message');
    });
  });
});