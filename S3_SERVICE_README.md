# Flexible S3 Service for NestJS WMS

A comprehensive, flexible S3 service implementation for NestJS applications following clean architecture principles. This service provides a complete set of S3 operations with proper validation, error handling, and configuration management.

## Features

- ✅ **Complete S3 Operations**: Upload, download, delete, copy, move, list files
- ✅ **Presigned URLs**: Generate presigned upload and download URLs
- ✅ **File Management**: Metadata retrieval, existence checks, batch operations
- ✅ **Flexible Configuration**: Environment-based configuration with overrides
- ✅ **Validation**: Comprehensive input validation and sanitization
- ✅ **Error Handling**: Proper error handling with meaningful messages
- ✅ **Logging**: Configurable logging for debugging and monitoring
- ✅ **Type Safety**: Full TypeScript support with interfaces and DTOs
- ✅ **RESTful API**: Complete REST API with Swagger documentation
- ✅ **Clean Architecture**: Proper separation of concerns and dependency injection

## Installation

The service requires the following dependencies:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/lib-storage uuid @types/uuid @types/multer
```

## Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3 Configuration
AWS_S3_ENDPOINT=https://s3.amazonaws.com  # Optional: for custom endpoints (e.g., MinIO)
AWS_S3_FORCE_PATH_STYLE=false             # Optional: for local development
AWS_S3_MAX_RETRIES=3                      # Optional: default 3
AWS_S3_REQUEST_TIMEOUT=30000              # Optional: default 30 seconds
AWS_S3_DEFAULT_BUCKET=my-default-bucket   # Optional: default bucket
AWS_S3_DEFAULT_ACL=private                # Optional: default ACL
AWS_S3_DEFAULT_EXPIRES_IN=3600            # Optional: default presigned URL expiration (1 hour)
AWS_S3_ALLOWED_FILE_TYPES=image/*,application/pdf  # Optional: allowed file types
AWS_S3_MAX_FILE_SIZE=104857600            # Optional: max file size (100MB)
AWS_S3_ENABLE_LOGGING=true                # Optional: enable logging
AWS_S3_ENABLE_METRICS=false               # Optional: enable metrics
```

### Local Development with MinIO

For local development, you can use MinIO as an S3-compatible storage:

```env
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_FORCE_PATH_STYLE=true
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

## Usage Examples

### Basic File Operations

```typescript
// Upload file
const metadata = await s3Service.uploadFile(
  'my-bucket',
  'uploads/file.txt',
  fileBuffer,
  { contentType: 'text/plain', acl: 'private' },
);

// Download file
const fileBuffer = await s3Service.downloadFile(
  'my-bucket',
  'uploads/file.txt',
);

// Delete file
await s3Service.deleteFile('my-bucket', 'uploads/file.txt');
```

### Advanced Operations

```typescript
// Generate presigned upload URL
const uploadUrl = await s3Service.generatePresignedUploadUrl(
  'my-bucket',
  'uploads/file.jpg',
  { expiresIn: 3600, contentType: 'image/jpeg' },
);

// List files with pagination
const result = await s3Service.listFiles('my-bucket', {
  prefix: 'uploads/',
  maxKeys: 100,
});

// Batch operations
const files = [
  { key: 'file1.txt', file: buffer1 },
  { key: 'file2.jpg', file: buffer2 },
];
const results = await s3Service.uploadMultipleFiles('my-bucket', files);
```

## REST API Endpoints

The service provides a complete REST API:

- `POST /s3/upload` - Upload file
- `GET /s3/download/:bucket/:key` - Download file
- `GET /s3/metadata/:bucket/:key` - Get file metadata
- `GET /s3/list/:bucket` - List files
- `PUT /s3/copy` - Copy file
- `DELETE /s3/:bucket/:key` - Delete file
- `POST /s3/presigned-upload-url` - Generate presigned upload URL
- `POST /s3/presigned-download-url` - Generate presigned download URL

## Error Handling

The service includes comprehensive error handling with proper HTTP status codes and meaningful error messages.

## Testing

The service is fully testable with unit tests and integration tests for all operations.

For more detailed documentation, see the inline code comments and TypeScript interfaces.
