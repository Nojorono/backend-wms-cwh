# S3 File Upload Module

A comprehensive and flexible S3 file upload module for the WMS NestJS application with advanced features for file handling, validation, and management.

## Features

### 🚀 Core Features

- **Flexible File Upload**: Single and batch file uploads with customizable options
- **Advanced Validation**: File type, size, and extension validation with custom rules
- **Multiple Upload Strategies**: Direct upload, presigned URLs, and custom validation
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Configuration Management**: Runtime configuration updates for upload settings
- **File Management**: Upload, download, copy, move, and delete operations
- **Metadata Support**: Rich metadata support for uploaded files
- **Security**: ACL controls and secure file handling

### 📁 File Operations

- Upload single or multiple files
- Download files as buffer or stream
- Copy and move files between buckets
- Delete single or multiple files
- List files with pagination
- Generate presigned URLs for secure access
- File existence checking
- Metadata retrieval

### 🔧 Configuration Options

- Maximum file size limits
- Allowed MIME types and extensions
- Unique file name generation
- Default bucket and upload paths
- Custom validation rules
- Error handling strategies

## API Endpoints

### Basic Upload Operations

#### 1. Single File Upload

```http
POST /s3/upload
Content-Type: multipart/form-data

{
  "bucket": "my-bucket",
  "key": "uploads/file.txt",
  "file": <binary-data>,
  "contentType": "text/plain",
  "acl": "private"
}
```

#### 2. Flexible Single File Upload

```http
POST /s3/upload/flexible
Content-Type: multipart/form-data

{
  "file": <binary-data>,
  "bucket": "my-bucket",
  "prefix": "documents",
  "preserveOriginalName": true,
  "contentType": "text/plain",
  "acl": "private",
  "metadata": {
    "category": "document",
    "author": "user123"
  }
}
```

#### 3. Batch File Upload

```http
POST /s3/upload/batch
Content-Type: multipart/form-data

{
  "files": [<binary-data-1>, <binary-data-2>],
  "bucket": "my-bucket",
  "prefix": "documents",
  "preserveOriginalNames": true,
  "continueOnError": true,
  "acl": "private"
}
```

### File Management Operations

#### 4. Download File

```http
GET /s3/download/{bucket}/{path}
```

#### 5. Get File Metadata

```http
GET /s3/metadata/{bucket}/{path}
```

#### 6. Check File Existence

```http
GET /s3/exists/{bucket}/{path}
```

#### 7. List Files

```http
GET /s3/list/{bucket}?prefix=uploads&maxKeys=100
```

#### 8. Delete File

```http
DELETE /s3/{bucket}/{path}
```

#### 9. Copy File

```http
PUT /s3/copy
{
  "sourceBucket": "source-bucket",
  "sourceKey": "source/file.txt",
  "destinationBucket": "dest-bucket",
  "destinationKey": "dest/file.txt"
}
```

### Advanced Operations

#### 10. File Validation

```http
POST /s3/upload/validate
Content-Type: multipart/form-data

{
  "files": [<binary-data-1>, <binary-data-2>]
}
```

#### 11. Custom Validation Upload

```http
POST /s3/upload/custom-validation
Content-Type: multipart/form-data

{
  "file": <binary-data>,
  "bucket": "my-bucket",
  "customValidationRules": {
    "maxFileSize": 5000000,
    "allowedMimeTypes": ["image/jpeg", "image/png"],
    "allowedExtensions": [".jpg", ".png"]
  }
}
```

#### 12. Generate Presigned URLs

```http
POST /s3/presigned-upload-url
{
  "bucket": "my-bucket",
  "key": "uploads/file.txt",
  "expiresIn": 3600,
  "contentType": "text/plain"
}
```

#### 13. Configuration Management

```http
GET /s3/upload/config
PUT /s3/upload/config
{
  "maxFileSize": 100000000,
  "allowedMimeTypes": ["image/*", "application/pdf"],
  "allowedExtensions": [".jpg", ".png", ".pdf"]
}
```

## Configuration

### Environment Variables

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_DEFAULT_BUCKET=wms-uploads
AWS_S3_ENDPOINT=https://s3.amazonaws.com  # Optional for custom endpoints

# File Upload Configuration
FILE_UPLOAD_MAX_SIZE=104857600  # 100MB
FILE_UPLOAD_ALLOWED_MIME_TYPES=image/jpeg,image/png,application/pdf
FILE_UPLOAD_ALLOWED_EXTENSIONS=.jpg,.jpeg,.png,.pdf
FILE_UPLOAD_GENERATE_UNIQUE_NAMES=true
FILE_UPLOAD_PATH=uploads
```

### Default Configuration

```typescript
{
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx'],
  generateUniqueNames: true,
  defaultBucket: 'wms-uploads',
  uploadPath: 'uploads'
}
```

## Usage Examples

### 1. Basic File Upload

```typescript
import { FileUploadService } from './infrastructure/services/file-upload.service';

@Injectable()
export class MyService {
  constructor(private readonly fileUploadService: FileUploadService) {}

  async uploadDocument(file: Express.Multer.File) {
    const result = await this.fileUploadService.uploadSingleFile(file, {
      bucket: 'documents',
      prefix: 'invoices',
      preserveOriginalName: false,
      s3Options: {
        contentType: 'application/pdf',
        acl: 'private',
        metadata: {
          category: 'invoice',
          uploadedBy: 'user123',
        },
      },
    });

    return result;
  }
}
```

### 2. Batch Upload with Error Handling

```typescript
async uploadMultipleDocuments(files: Express.Multer.File[]) {
  const result = await this.fileUploadService.uploadMultipleFiles(files, {
    bucket: 'documents',
    prefix: 'batch-upload',
    preserveOriginalNames: true,
    continueOnError: true,
    s3Options: {
      acl: 'private',
      metadata: {
        batchId: 'batch-001',
        uploadedAt: new Date().toISOString()
      }
    }
  });

  console.log(`Uploaded ${result.successfulUploads}/${result.totalFiles} files`);
  if (result.errors?.length > 0) {
    console.log('Errors:', result.errors);
  }

  return result;
}
```

### 3. Custom Validation

```typescript
async uploadWithCustomValidation(file: Express.Multer.File) {
  const customValidation = (file: Express.Multer.File) => {
    const errors: string[] = [];

    // Custom business rules
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      errors.push('File too large for this operation');
    }

    if (!file.originalname.includes('invoice')) {
      errors.push('File must be an invoice');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  };

  return await this.fileUploadService.uploadFileWithCustomValidation(
    file,
    customValidation,
    {
      bucket: 'invoices',
      prefix: 'validated'
    }
  );
}
```

### 4. Using S3 Service Directly

```typescript
import { S3Service } from './infrastructure/services/s3.service';

@Injectable()
export class MyService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFile(file: Buffer, bucket: string, key: string) {
    return await this.s3Service.uploadFile(bucket, key, file, {
      contentType: 'application/pdf',
      acl: 'private',
      metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  async generatePresignedUrl(bucket: string, key: string) {
    return await this.s3Service.generatePresignedUploadUrl(bucket, key, {
      expiresIn: 3600,
      contentType: 'application/pdf',
    });
  }
}
```

## Error Handling

The module provides comprehensive error handling:

### Validation Errors

- File size exceeds limits
- Unsupported file types
- Invalid file extensions
- Custom validation failures

### S3 Errors

- Bucket access denied
- File not found
- Network connectivity issues
- AWS service errors

### Example Error Response

```json
{
  "success": false,
  "message": "File validation failed: File size exceeds maximum allowed size",
  "errors": ["File size 150000000 exceeds maximum allowed size 100000000"]
}
```

## Security Features

### Access Control

- Configurable ACL settings (private, public-read, etc.)
- Bucket-level permissions
- Key-based access control

### File Validation

- MIME type validation
- File extension checking
- Size limits
- Custom validation rules

### Secure Uploads

- Presigned URLs for secure uploads
- Metadata sanitization
- File name sanitization

## Performance Considerations

### File Size Limits

- Default: 100MB per file
- Configurable via environment variables
- Multer middleware limits

### Batch Operations

- Parallel upload processing
- Configurable concurrency
- Error handling per file

### Caching

- Metadata caching
- URL generation optimization
- Connection pooling

## Monitoring and Logging

### Logging Levels

- Debug: Detailed operation logs
- Info: Successful operations
- Warn: Validation warnings
- Error: Failed operations

### Metrics

- Upload success/failure rates
- File size distributions
- Processing times
- Error frequencies

## Best Practices

### 1. File Naming

- Use unique names to prevent conflicts
- Sanitize file names for S3 compatibility
- Use meaningful prefixes for organization

### 2. Error Handling

- Always handle upload errors gracefully
- Provide meaningful error messages
- Implement retry logic for transient failures

### 3. Security

- Validate file types and sizes
- Use appropriate ACL settings
- Sanitize metadata inputs

### 4. Performance

- Use batch uploads for multiple files
- Implement proper error handling
- Monitor upload performance

### 5. Organization

- Use consistent naming conventions
- Organize files with prefixes
- Implement proper cleanup procedures

## Troubleshooting

### Common Issues

1. **File Upload Fails**

   - Check file size limits
   - Verify MIME type is allowed
   - Ensure S3 credentials are correct

2. **Validation Errors**

   - Check allowed file types
   - Verify file extensions
   - Review custom validation rules

3. **S3 Access Issues**

   - Verify AWS credentials
   - Check bucket permissions
   - Ensure region is correct

4. **Performance Issues**
   - Check file size limits
   - Review network connectivity
   - Monitor S3 service status

### Debug Mode

Enable debug logging by setting:

```env
AWS_S3_ENABLE_LOGGING=true
```

This will provide detailed logs for troubleshooting upload issues.

## Integration with WMS

The S3 module is designed to integrate seamlessly with the WMS application:

- **Inventory Management**: Store product images and documents
- **Document Management**: Handle invoices, receipts, and reports
- **User Management**: Store user avatars and profile documents
- **Audit Trails**: Maintain file upload logs and metadata

## Support

For issues or questions regarding the S3 module:

1. Check the logs for detailed error messages
2. Verify configuration settings
3. Review the API documentation
4. Contact the development team

---

**Note**: This module requires proper AWS S3 credentials and bucket configuration. Ensure all environment variables are set correctly before use.
