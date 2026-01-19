# Notification History System

## Overview

The notification history system automatically persists all notifications sent through the WebSocket system to a database for auditing, tracking, and retrieval purposes.

## Database Schema

### Entity: `notification_history`

```typescript
{
  id: UUID (primary key),
  type: string,                      // Notification type
  title: string,                     // Notification title
  message: text,                     // Notification message
  priority: string,                  // LOW, MEDIUM, HIGH, URGENT
  entity_id: UUID,                   // Related entity ID
  entity_type: string,               // Entity type (inbound, picking, etc.)
  metadata: JSONB,                   // Additional data
  user_id: UUID,                     // User who triggered
  username: string,                  // Username
  rooms: string[],                   // Rooms notification was sent to (including role:ROLE_NAME)
  recipients: string[],              // Specific recipient IDs
  roles: string[],                   // Target roles
  status: enum,                      // SENT, DELIVERED, READ, FAILED
  sent_at: timestamp,                // When sent
  delivered_at: timestamp,           // When delivered
  read_at: timestamp,                // When read
  read_by: UUID,                     // Who read it
  error_message: text,               // Error if failed
  is_broadcast: boolean,             // True if sent to all
  organization_id: UUID,             // Organization context
  warehouse_id: UUID,                // Warehouse context
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp (soft delete)
}
```

### Indexes

- `(user_id, createdAt)` - Fast user notification queries
- `(type, createdAt)` - Filter by notification type
- `(status)` - Filter by read/unread status
- `(entity_type, entity_id)` - Track notifications for specific entities

## Automatic History Saving

All notifications are automatically saved to history when sent:

```typescript
// This automatically saves to history
this.notificationService.notifyInboundCreated({
  inboundId: inbound.id,
  inboundNumber: inbound.inbound_number,
  expedition: inbound.expedition,
  rooms: ['warehouse_123'],
});
```

## API Endpoints

### 1. Get Notification History (Paginated)

```http
GET /notification-history?page=1&limit=10&userId={userId}&unreadOnly=true
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search in title/message
- `sortBy` - Sort field (createdAt, sentAt, readAt, type, priority, status)
- `sortOrder` - ASC or DESC
- `userId` - Filter by user ID
- `type` - Filter by notification type
- `status` - Filter by status (SENT, DELIVERED, READ, FAILED)
- `priority` - Filter by priority
- `entityType` - Filter by entity type
- `entityId` - Filter by entity ID
- `warehouseId` - Filter by warehouse
- `organizationId` - Filter by organization
- `unreadOnly` - Show only unread notifications
- `role` - Filter by target role (`role:ROLE_NAME`)
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "message": "Notification history berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "INBOUND_CREATED",
      "title": "Inbound Baru Dibuat",
      "message": "Inbound INB-2025-001 dari JNE telah dibuat",
      "priority": "MEDIUM",
      "entity_id": "...",
      "entity_type": "inbound",
      "status": "READ",
      "sent_at": "2025-11-11T08:30:00.000Z",
      "read_at": "2025-11-11T08:35:00.000Z",
      "read_by": "user-id",
      "rooms": ["warehouse_123"],
      "roles": ["WAREHOUSE_MANAGER"],
      "createdAt": "2025-11-11T08:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 2. Get Notification Detail

```http
GET /notification-history/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Detail notifikasi berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "INBOUND_CREATED",
    "title": "Inbound Baru Dibuat",
    "message": "Inbound INB-2025-001 dari JNE telah dibuat",
    "priority": "MEDIUM",
    "metadata": {
      "expedition": "JNE",
      "driver": "Ahmad"
    },
    "status": "READ",
    "sent_at": "2025-11-11T08:30:00.000Z",
    "read_at": "2025-11-11T08:35:00.000Z"
  }
}
```

### 3. Get Notification Statistics

```http
GET /notification-history/stats?userId={userId}&warehouseId={warehouseId}
```

**Response:**
```json
{
  "success": true,
  "message": "Statistik notifikasi berhasil diambil",
  "data": {
    "total": 150,
    "unread": 25,
    "read": 125,
    "byPriority": {
      "LOW": 50,
      "MEDIUM": 70,
      "HIGH": 25,
      "URGENT": 5
    },
    "byType": {
      "INBOUND_CREATED": 30,
      "PICKING_ASSIGNED": 45,
      "PALLET_FULL": 15
    },
    "byStatus": {
      "SENT": 100,
      "DELIVERED": 90,
      "READ": 125,
      "FAILED": 5
    }
  }
}
```

### 4. Get Unread Count

```http
GET /notification-history/unread-count/{userId}
```

**Response:**
```json
{
  "success": true,
  "message": "Jumlah notifikasi belum dibaca berhasil diambil",
  "data": {
    "count": 25
  }
}
```

### 5. Mark as Read

```http
PATCH /notification-history/mark-as-read
Content-Type: application/json

{
  "notificationId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-id",
  "username": "john_doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifikasi berhasil ditandai sebagai dibaca",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "READ",
    "read_at": "2025-11-11T08:35:00.000Z",
    "read_by": "user-id"
  }
}
```

### 6. Bulk Mark as Read

```http
PATCH /notification-history/bulk-mark-as-read
Content-Type: application/json

{
  "notificationIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ],
  "userId": "user-id",
  "username": "john_doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 notifikasi berhasil ditandai sebagai dibaca"
}
```

### 7. Cleanup Old Notifications

```http
DELETE /notification-history/cleanup/30
```

Deletes read notifications older than 30 days.

**Response:**
```json
{
  "success": true,
  "message": "150 notifikasi lama berhasil dihapus",
  "data": {
    "deleted": 150
  }
}
```

## Frontend Integration

### Get User Notifications

```typescript
const getUserNotifications = async (userId: string, unreadOnly = false) => {
  const response = await fetch(
    `/notification-history?userId=${userId}&unreadOnly=${unreadOnly}&page=1&limit=20&sortBy=createdAt&sortOrder=DESC`
  );
  return response.json();
};
```

### Display Unread Badge

```typescript
const NotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const response = await fetch(`/notification-history/unread-count/${userId}`);
      const data = await response.json();
      setUnreadCount(data.data.count);
    };

    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <Badge count={unreadCount}>
      <BellIcon />
    </Badge>
  );
};
```

### Mark Notification as Read

```typescript
const markAsRead = async (notificationId: string, userId: string) => {
  await fetch('/notification-history/mark-as-read', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notificationId,
      userId,
    }),
  });
};
```

### Mark All as Read

```typescript
const markAllAsRead = async (notificationIds: string[], userId: string) => {
  await fetch('/notification-history/bulk-mark-as-read', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notificationIds,
      userId,
    }),
  });
};
```

## Notification Status Flow

```
SENT → DELIVERED → READ
  ↓
FAILED (if error)
```

- **SENT**: Notification sent to WebSocket
- **DELIVERED**: Client acknowledged receipt (optional)
- **READ**: User marked as read
- **FAILED**: Failed to send

## Use Cases

### 1. Notification Center

Show all user notifications with read/unread status:

```typescript
GET /notification-history?userId={userId}&page=1&limit=20&sortBy=createdAt&sortOrder=DESC
```

### 2. Unread Badge

Display count of unread notifications:

```typescript
GET /notification-history/unread-count/{userId}
```

### 3. Entity History

Show all notifications related to a specific entity:

```typescript
GET /notification-history?entityType=inbound&entityId={inboundId}
```

### 4. Warehouse Dashboard

Show all notifications for a warehouse:

```typescript
GET /notification-history?warehouseId={warehouseId}&startDate=2025-11-01&endDate=2025-11-30
```

### 5. Audit Trail

Track all system notifications:

```typescript
GET /notification-history?type=SYSTEM_ERROR&startDate=2025-11-01
```

### 6. User Activity

Track what a user has been notified about:

```typescript
GET /notification-history?userId={userId}&startDate=2025-11-01
```

### 7. Role Channels

Track notifications sent to a specific role:

```typescript
GET /notification-history?role=WAREHOUSE_MANAGER&startDate=2025-11-01
```

## Best Practices

1. **Pagination**: Always use pagination for large datasets
2. **Filters**: Use filters to reduce data transfer
3. **Cleanup**: Regularly clean old read notifications (e.g., monthly cron job)
4. **Indexes**: Database indexes optimize common queries
5. **Soft Delete**: Notifications are soft-deleted for audit purposes
6. **Status Tracking**: Update status as notifications are delivered/read
7. **Statistics**: Use stats endpoint for dashboard metrics

## Database Maintenance

### Manual Cleanup Script

```sql
-- Delete read notifications older than 90 days
DELETE FROM notification_history 
WHERE status = 'READ' 
AND read_at < NOW() - INTERVAL '90 days';
```

### Scheduled Cleanup

Create a cron job to run monthly:

```typescript
// In your cron service
@Cron('0 0 1 * *') // First day of every month at midnight
async cleanupOldNotifications() {
  const deleted = await this.notificationHistoryService.deleteOldNotifications(90);
  this.logger.log(`Cleaned up ${deleted} old notifications`);
}
```

## Monitoring

### Key Metrics to Track

1. **Total notifications sent** (daily/weekly/monthly)
2. **Unread rate** (unread / total)
3. **Read rate** (read / total)
4. **Failed notifications** (for debugging)
5. **Response time** (delivery time)
6. **Top notification types** (for optimization)

### Example Dashboard Queries

```typescript
// Get today's stats
GET /notification-history/stats?startDate=2025-11-11T00:00:00Z&endDate=2025-11-11T23:59:59Z

// Get warehouse activity
GET /notification-history/stats?warehouseId={id}&startDate=2025-11-01

// Get user engagement
GET /notification-history?userId={id}&status=READ&startDate=2025-11-01
```

## Support

For issues or questions about notification history:
1. Check notification status in database
2. Verify indexes are created
3. Check logs for errors
4. Monitor database size and cleanup old records

## Related Documentation

- [WebSocket Documentation](./WEBSOCKET_DOCUMENTATION.md)
- [Notification Module README](./README.md)

