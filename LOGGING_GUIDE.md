# Logging Guide - WMS NestJS

## 📝 Overview

The WMS application uses **Winston** with **daily-rotate-file** for comprehensive logging. All application activities are automatically logged to daily rotating log files.

---

## 🎯 Features

- ✅ **Daily File Rotation** - New log file created each day
- ✅ **Automatic Logging** - All HTTP requests/responses logged automatically
- ✅ **Error Tracking** - Separate error log files
- ✅ **Exception Handling** - Unhandled exceptions and promise rejections logged
- ✅ **Structured Logging** - JSON format with timestamps and context
- ✅ **Sensitive Data Protection** - Passwords and tokens automatically redacted
- ✅ **Log Retention** - Configurable retention period (30 days default)
- ✅ **Compression** - Old log files automatically compressed

---

## 📂 Log File Structure

Logs are stored in the `logs/` directory (configurable via `LOG_DIR` environment variable):

```
logs/
├── application-2024-01-15.log      # All application logs
├── application-2024-01-15.log.gz   # Compressed old logs
├── error-2024-01-15.log            # Error logs only
├── error-2024-01-15.log.gz         # Compressed old error logs
├── exceptions-2024-01-15.log       # Unhandled exceptions
├── rejections-2024-01-15.log       # Unhandled promise rejections
└── ...
```

### Log File Naming

- **Format:** `{type}-YYYY-MM-DD.log`
- **Example:** `application-2024-01-15.log`
- **Compressed:** `application-2024-01-15.log.gz`

---

## 📊 Log Levels

The application uses standard log levels:

| Level | Usage | Example |
|-------|-------|---------|
| **error** | Errors that need attention | Failed database connection |
| **warn** | Warning messages | Deprecated API usage |
| **info** | General information | Request/response logging |
| **debug** | Debug information | Detailed operation logs |
| **verbose** | Verbose information | Very detailed logs |

### Default Log Level

- **Development:** `info`
- **Production:** `info` (configurable via `LOG_LEVEL`)

---

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Log directory (default: logs)
LOG_DIR=logs

# Log level (default: info)
# Options: error, warn, info, debug, verbose
LOG_LEVEL=info

# Node environment
NODE_ENV=development
```

### Log Retention

Configured in `src/infrastructure/services/logger.service.ts`:

```typescript
// Application logs: 30 days
maxFiles: '30d'

// Error logs: 90 days
maxFiles: '90d'

// Exception logs: 90 days
maxFiles: '90d'
```

### Log File Size

- **Max Size:** 20MB per file
- **Compression:** Automatic when file rotates
- **Format:** Gzip compression

---

## 📝 What Gets Logged

### 1. **HTTP Requests** (Automatic)

Every incoming HTTP request is logged with:
- Method (GET, POST, PUT, DELETE, etc.)
- URL
- Query parameters
- Request body (sensitive data redacted)
- User information (if authenticated)
- IP address
- Timestamp

**Example Log Entry:**
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "info",
  "message": "Incoming Request",
  "context": "HTTP",
  "method": "POST",
  "url": "/api/inbound",
  "ip": "192.168.1.100",
  "user": "john.doe",
  "body": {
    "do_no": "DO-001",
    "supplier_id": "uuid-123"
  }
}
```

### 2. **HTTP Responses** (Automatic)

Every outgoing HTTP response is logged with:
- Method
- URL
- Status code
- Response time (in milliseconds)
- User information

**Example Log Entry:**
```json
{
  "timestamp": "2024-01-15 10:30:46",
  "level": "info",
  "message": "Outgoing Response",
  "context": "HTTP",
  "method": "POST",
  "url": "/api/inbound",
  "statusCode": 201,
  "responseTime": "125ms",
  "user": "john.doe"
}
```

### 3. **Errors** (Automatic)

All errors are logged with:
- Error message
- Stack trace
- HTTP status code
- Request context
- User information

**Example Log Entry:**
```json
{
  "timestamp": "2024-01-15 10:30:46",
  "level": "error",
  "message": "Validation failed",
  "context": "HttpExceptionFilter",
  "stack": "Error: Validation failed\n    at ...",
  "statusCode": 400,
  "request": {
    "method": "POST",
    "url": "/api/inbound",
    "body": { ... }
  }
}
```

### 4. **Application Events** (Manual)

You can log custom events in your services:

```typescript
import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../infrastructure/services/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: AppLoggerService) {}

  async doSomething() {
    this.logger.log('Operation started', 'MyService');
    
    try {
      // Your code here
      this.logger.log('Operation completed successfully', 'MyService');
    } catch (error) {
      this.logger.error('Operation failed', error.stack, 'MyService');
    }
  }
}
```

### 5. **Unhandled Exceptions** (Automatic)

All unhandled exceptions are automatically logged to `exceptions-{date}.log`.

### 6. **Unhandled Promise Rejections** (Automatic)

All unhandled promise rejections are automatically logged to `rejections-{date}.log`.

---

## 🔒 Security - Sensitive Data Protection

The logger automatically redacts sensitive information from request bodies:

### Redacted Fields:
- `password`
- `token`
- `secret`
- `authorization`
- `apikey`
- `api_key`

### Example:

**Before Redaction:**
```json
{
  "username": "john.doe",
  "password": "secret123"
}
```

**After Redaction:**
```json
{
  "username": "john.doe",
  "password": "***REDACTED***"
}
```

---

## 💻 Usage in Code

### Using Logger in Services

```typescript
import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../infrastructure/services/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: AppLoggerService) {}

  async myMethod() {
    // Info log
    this.logger.log('Processing started', 'MyService');

    // Debug log
    this.logger.debug('Debug information', 'MyService');

    // Warning log
    this.logger.warn('This is a warning', 'MyService');

    // Error log
    try {
      // Some operation
    } catch (error) {
      this.logger.error('Operation failed', error.stack, 'MyService');
    }
  }
}
```

### Using Logger in Controllers

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppLoggerService } from '../infrastructure/services/logger.service';

@Controller('my-endpoint')
export class MyController {
  constructor(private readonly logger: AppLoggerService) {}

  @Get()
  async getData() {
    this.logger.log('Fetching data', 'MyController');
    // Your code
  }
}
```

---

## 📈 Log Analysis

### Viewing Logs

#### **Real-time Logs (Development)**
```bash
# Tail the latest log file
tail -f logs/application-$(date +%Y-%m-%d).log

# Tail error logs
tail -f logs/error-$(date +%Y-%m-%d).log
```

#### **Search Logs**
```bash
# Search for specific user
grep "john.doe" logs/application-*.log

# Search for errors
grep "ERROR" logs/application-*.log

# Search for specific endpoint
grep "/api/inbound" logs/application-*.log

# Search with date range
grep "2024-01-15" logs/application-*.log
```

#### **View Compressed Logs**
```bash
# Decompress and view
gunzip -c logs/application-2024-01-15.log.gz | less

# Search compressed logs
zgrep "error" logs/application-*.log.gz
```

### Log Analysis Tools

You can use tools like:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana Loki**
- **Splunk**
- **CloudWatch** (AWS)
- **Azure Monitor** (Azure)

---

## 🎯 Best Practices

### 1. **Use Appropriate Log Levels**

```typescript
// ✅ Good
this.logger.error('Database connection failed', error.stack, 'DatabaseService');
this.logger.warn('Deprecated API endpoint used', 'ApiController');
this.logger.info('User logged in', 'AuthService');
this.logger.debug('Query executed', 'Repository');

// ❌ Bad
this.logger.error('User logged in', 'AuthService'); // Should be info
this.logger.info('Database connection failed', 'DatabaseService'); // Should be error
```

### 2. **Include Context**

Always provide context (service/controller name):

```typescript
// ✅ Good
this.logger.log('Operation completed', 'MyService');

// ❌ Bad
this.logger.log('Operation completed'); // No context
```

### 3. **Log Important Business Events**

```typescript
// Log inventory changes
this.logger.log(`Inventory updated: ${itemId}, quantity: ${quantity}`, 'InventoryService');

// Log user actions
this.logger.log(`User ${userId} created order ${orderId}`, 'OrderService');

// Log system events
this.logger.log('Scheduled job started', 'SchedulerService');
```

### 4. **Don't Log Sensitive Data**

The logger automatically redacts common sensitive fields, but be careful with custom fields:

```typescript
// ❌ Bad - Don't log sensitive data
this.logger.log(`User password: ${password}`, 'AuthService');

// ✅ Good - Let logger handle redaction
this.logger.logRequest({ body: { username, password } });
```

### 5. **Use Structured Logging**

Include relevant metadata:

```typescript
// ✅ Good
this.logger.log(`Order ${orderId} created by user ${userId}`, 'OrderService');

// Better - Use logRequest/logResponse for HTTP
this.logger.logRequest({ method: 'POST', url: '/api/orders', body: orderData });
```

---

## 🔍 Troubleshooting

### Logs Not Being Created

1. **Check directory permissions:**
   ```bash
   ls -la logs/
   chmod 755 logs/
   ```

2. **Check environment variables:**
   ```bash
   echo $LOG_DIR
   echo $LOG_LEVEL
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

### Logs Too Large

1. **Reduce log level:**
   ```env
   LOG_LEVEL=warn  # Only log warnings and errors
   ```

2. **Reduce retention period:**
   Edit `logger.service.ts`:
   ```typescript
   maxFiles: '7d'  // Keep only 7 days
   ```

3. **Reduce max file size:**
   ```typescript
   maxSize: '10m'  // 10MB instead of 20MB
   ```

### Missing Logs

1. **Check if logger is initialized:**
   Check `main.ts` - logger should be set up before app starts

2. **Check log level:**
   If `LOG_LEVEL=error`, info logs won't appear

3. **Check file rotation:**
   Logs might be in a different day's file

---

## 📚 Integration with Monitoring

### Health Checks

The logger can be integrated with health check endpoints:

```typescript
@Get('health')
async healthCheck() {
  const logFiles = fs.readdirSync('logs');
  return {
    status: 'ok',
    logFiles: logFiles.length,
    logDir: process.env.LOG_DIR || 'logs',
  };
}
```

### Metrics

You can extract metrics from logs:

```bash
# Count errors today
grep -c "ERROR" logs/error-$(date +%Y-%m-%d).log

# Count requests per endpoint
grep -o "/api/[^ ]*" logs/application-*.log | sort | uniq -c

# Average response time
grep "responseTime" logs/application-*.log | awk '{print $NF}' | awk -F'ms' '{sum+=$1; count++} END {print sum/count}'
```

---

## 🚀 Production Considerations

### 1. **Log Rotation**

Already configured with daily rotation and compression.

### 2. **Log Aggregation**

Consider using:
- **CloudWatch Logs** (AWS)
- **Azure Monitor** (Azure)
- **Google Cloud Logging** (GCP)
- **ELK Stack** (Self-hosted)

### 3. **Performance**

Logging is asynchronous and won't block requests. However:
- Use appropriate log levels in production
- Monitor log file sizes
- Set up alerts for error rates

### 4. **Security**

- Logs are stored locally by default
- Sensitive data is automatically redacted
- Consider encrypting log files in production
- Restrict access to log directory

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review log files
3. Check environment variables
4. Contact the development team

---

## 🔄 Changelog

### Version 1.0.0
- Initial implementation
- Daily file rotation
- Automatic request/response logging
- Error tracking
- Sensitive data protection

---

**Happy Logging! 📝**

