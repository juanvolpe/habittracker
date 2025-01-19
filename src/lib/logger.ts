type LogLevel = 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

interface AuthAttemptContext {
  reason?: 'user_not_found' | 'invalid_password';
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private isProd = process.env.NODE_ENV === 'production';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): LogMessage {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        environment: process.env.NODE_ENV
      }
    };
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const logMessage = this.formatMessage(level, message, context);
    
    if (this.isProd) {
      console[level](JSON.stringify(logMessage));
    } else {
      const timestamp = new Date().toLocaleTimeString();
      console[level](
        `[${timestamp}] ${level.toUpperCase()}: ${message}`,
        context ? context : ''
      );
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }

  authAttempt(email: string, success: boolean, context?: AuthAttemptContext) {
    const authContext = context || {};
    this.log(
      success ? 'info' : 'warn',
      `Authentication attempt ${success ? 'successful' : 'failed'} for ${email}`,
      {
        authEvent: 'attempt',
        success,
        email: this.maskEmail(email),
        ...authContext
      }
    );
  }

  authError(message: string, error: Error, context?: Record<string, any>) {
    this.error(`Auth Error: ${message}`, error, {
      authEvent: 'error',
      ...context
    });
  }

  sessionError(message: string, error: Error, context?: Record<string, any>) {
    this.error(`Session Error: ${message}`, error, {
      authEvent: 'session_error',
      ...context
    });
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }
}

export const logger = Logger.getInstance(); 