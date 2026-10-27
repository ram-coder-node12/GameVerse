// server/utils/logger.js
// Safe logging utility that avoids logging passwords, JWT secrets, or sensitive tokens.

const isProduction = process.env.NODE_ENV === 'production';

function sanitize(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    // Redact password or token fields if embedded in string
    return data.replace(/(password|token|secret|jwt)\s*[:=]\s*["']?[^"',\s]+["']?/gi, '$1: [REDACTED]');
  }
  if (typeof data === 'object') {
    const copy = Array.isArray(data) ? [...data] : { ...data };
    for (const key of Object.keys(copy)) {
      if (/password|token|secret|authorization/i.test(key)) {
        copy[key] = '[REDACTED]';
      } else if (typeof copy[key] === 'object') {
        copy[key] = sanitize(copy[key]);
      }
    }
    return copy;
  }
  return data;
}

const logger = {
  info: (message, meta) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.log(`[${timestamp}] [INFO] ${message}`, sanitize(meta));
    } else {
      console.log(`[${timestamp}] [INFO] ${message}`);
    }
  },
  warn: (message, meta) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.warn(`[${timestamp}] [WARN] ${message}`, sanitize(meta));
    } else {
      console.warn(`[${timestamp}] [WARN] ${message}`);
    }
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const errorDetails = error ? {
      message: error.message || error,
      stack: isProduction ? undefined : error.stack
    } : undefined;
    console.error(`[${timestamp}] [ERROR] ${message}`, errorDetails || '');
  },
  debug: (message, meta) => {
    if (isProduction) return;
    const timestamp = new Date().toISOString();
    if (meta) {
      console.debug(`[${timestamp}] [DEBUG] ${message}`, sanitize(meta));
    } else {
      console.debug(`[${timestamp}] [DEBUG] ${message}`);
    }
  }
};

module.exports = logger;
