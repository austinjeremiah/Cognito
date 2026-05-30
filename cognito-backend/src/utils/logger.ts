import winston from 'winston';

const SENSITIVE_KEYS = ['privateKey', 'private_key', 'mnemonic', 'SUI_PRIVATE_KEY'];

const redactSensitive = winston.format((info) => {
  const sanitized = { ...info };
  for (const key of SENSITIVE_KEYS) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    redactSensitive(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export default logger;
