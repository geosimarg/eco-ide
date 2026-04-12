import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('DEV', 'true');

describe('Logger Utility', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Logger Interface', () => {
    it('should have log, error, warn, info, debug methods', async () => {
      const { logger } = await import('@/utils/logger');
      
      expect(typeof logger.log).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('In development mode', () => {
    it('should call console.log', async () => {
      const { logger } = await import('@/utils/logger');
      
      logger.log('test message', { data: 123 });

      expect(consoleSpy.log).toHaveBeenCalledWith('test message', { data: 123 });
    });

    it('should call console.error', async () => {
      const { logger } = await import('@/utils/logger');
      
      logger.error('error message', new Error('test'));

      expect(consoleSpy.error).toHaveBeenCalledWith('error message', new Error('test'));
    });

    it('should call console.warn', async () => {
      const { logger } = await import('@/utils/logger');
      
      logger.warn('warning message');

      expect(consoleSpy.warn).toHaveBeenCalledWith('warning message');
    });

    it('should call console.info', async () => {
      const { logger } = await import('@/utils/logger');
      
      logger.info('info message');

      expect(consoleSpy.info).toHaveBeenCalledWith('info message');
    });

    it('should call console.debug', async () => {
      const { logger } = await import('@/utils/logger');
      
      logger.debug('debug message');

      expect(consoleSpy.debug).toHaveBeenCalledWith('debug message');
    });

    it('should handle multiple arguments', async () => {
      const { logger } = await import('@/utils/logger');
      
      logger.log('string', 123, { obj: true }, null);

      expect(consoleSpy.log).toHaveBeenCalledWith('string', 123, { obj: true }, null);
    });

    it('should handle undefined and null arguments', async () => {
      const { logger } = await import('@/utils/logger');
      
      logger.log(undefined, null, 'string');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(undefined, null, 'string');
    });
  });
});