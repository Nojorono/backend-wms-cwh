# WebSocket Notification System Documentation

## Overview

The WMS WebSocket notification system provides real-time updates for all warehouse operations. It uses Socket.IO for bidirectional communication between the server and clients.

## Quick Frontend Setup

1. **Install the Socket.IO client**
   ```bash
   npm install socket.io-client
   ```

2. **Create a singleton socket**
   ```typescript
   // src/libs/socket.ts
   import { io, Socket } from 'socket.io-client';

   const url = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000/notifications';

   export const socket: Socket = io(url, {
     transports: ['websocket'],
     withCredentials: true,
     autoConnect: true,
     reconnectionDelayMax: 5000,
   });
   ```

3. **Wire the socket in your app**
   ```typescript
   useEffect(() => {
     socket.on('connected', (payload) => console.log('Connected', payload));
     socket.on('notification', handleNotification);

     return () => {
       socket.off('notification', handleNotification);
       socket.disconnect();
     };
   }, []);
   ```

4. **Join context rooms after auth**
   ```typescript
   socket.emit('join_room', { room: `warehouse_${warehouseId}` });
   socket.emit('join_room', { room: `user_${userId}` });
   socket.emit('join_room', { room: `organization_${organizationId}` });
   socket.emit('join_room', { room: `memo_${memoId}` });
   socket.emit('join_roles', { roles: userRoles }); // e.g. ['SUPERVISOR']
   ```

5. **Subscribe to types if needed**
   ```typescript
   socket.emit('subscribe', {
     types: ['INBOUND_CREATED', 'PICKING_ASSIGNED'],
   });
   ```

6. **Display notifications**
   - Render toast or modal depending on `priority`
   - Update unread badge via `GET /notification-history/unread-count/{userId}`
   - Store notifications locally (state/store) for a notification center

## Connection

### Endpoint
```
ws://localhost:3000/notifications
```

### In Production
```
wss://your-domain.com/notifications
```

## Client Connection Example

### JavaScript/TypeScript
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Listen for connection
socket.on('connected', (data) => {
  console.log('Connected to WMS notifications:', data);
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('Received notification:', notification);
  // Handle notification based on type
  handleNotification(notification);
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from WMS notifications');
});
```

### React Hook Example
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useWMSNotifications = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000/notifications');
    
    newSocket.on('connected', (data) => {
      console.log('Connected:', data);
    });

    newSocket.on('notification', (notification) => {
      setNotifications((prev) => [...prev, notification]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, notifications };
};
```

## Room Management

### Join a Room
Subscribe to notifications for a specific context (warehouse, user, organization, etc.)

```typescript
socket.emit('join_room', { room: 'warehouse_123' });

// Listen for confirmation
socket.on('room_joined', (data) => {
  console.log('Joined room:', data.room);
});
```

### Leave a Room
```typescript
socket.emit('leave_room', { room: 'warehouse_123' });

// Listen for confirmation
socket.on('room_left', (data) => {
  console.log('Left room:', data.room);
});
```

### Join Role-Based Rooms
Group clients by user role to receive team-specific notifications.

```typescript
socket.emit('join_roles', { roles: ['WAREHOUSE_MANAGER', 'PICKER_LEAD'] });

socket.on('roles_joined', (data) => {
  console.log('Joined role rooms:', data.roles);
});
```

### Leave Role-Based Rooms
```typescript
socket.emit('leave_roles', { roles: ['WAREHOUSE_MANAGER'] });

socket.on('roles_left', (data) => {
  console.log('Left role rooms:', data.roles);
});
```

### Room Naming Conventions
- `warehouse_{id}` - Warehouse-specific notifications
- `user_{id}` - User-specific notifications
- `organization_{id}` - Organization-specific notifications
- `do_{id}` - Delivery Order specific notifications
- `memo_{id}` - Outbound Memo specific notifications
- `role_{ROLE_NAME}` - Role-specific notifications (uppercase recommended)

## Notification Type Subscriptions

### Subscribe to Notification Types
```typescript
socket.emit('subscribe', { 
  types: ['INBOUND_CREATED', 'PICKING_ASSIGNED', 'PALLET_FULL'] 
});

socket.on('subscribed', (data) => {
  console.log('Subscribed to types:', data.types);
});
```

### Unsubscribe from Notification Types
```typescript
socket.emit('unsubscribe', { 
  types: ['INBOUND_CREATED'] 
});

socket.on('unsubscribed', (data) => {
  console.log('Unsubscribed from types:', data.types);
});
```

## Notification Types

### Inbound Notifications
- `INBOUND_CREATED` - New inbound shipment created
- `INBOUND_UPDATED` - Inbound details updated
- `INBOUND_STATUS_CHANGED` - Inbound status changed
- `INBOUND_DO_VALIDATED` - Inbound DO validated
- `INBOUND_INSPECTION_READY` - Ready for inspection
- `INBOUND_INSPECTION_APPROVED` - Inspection approved

### Scan Inbound Notifications
- `SCAN_INBOUND_COMPLETED` - Scan inbound completed
- `SCAN_INBOUND_PENDING` - Scan inbound pending

### Put Away Notifications
- `PUT_AWAY_ASSIGNED` - Put away task assigned
- `PUT_AWAY_COMPLETED` - Put away completed
- `PUT_AWAY_IN_PROGRESS` - Put away in progress

### Inventory Notifications
- `INVENTORY_UPDATED` - Inventory updated
- `INVENTORY_LOW_STOCK` - Low stock alert
- `INVENTORY_LOCATION_CHANGED` - Inventory location changed

### Outbound Memo Notifications
- `OUTBOUND_MEMO_CREATED` - New outbound memo created
- `OUTBOUND_MEMO_APPROVED` - Memo approved
- `OUTBOUND_MEMO_REJECTED` - Memo rejected
- `OUTBOUND_MEMO_COMPLETED` - Memo completed

### Outbound DO Notifications
- `OUTBOUND_DO_CREATED` - New outbound DO created
- `OUTBOUND_DO_UPDATED` - DO updated
- `OUTBOUND_DO_STATUS_CHANGED` - DO status changed
- `OUTBOUND_DO_READY` - DO ready for shipping

### Picking Notifications
- `PICKING_ASSIGNED` - Picking task assigned
- `PICKING_STARTED` - Picking started
- `PICKING_COMPLETED` - Picking completed
- `PICKING_SUGGESTION_READY` - Picking suggestions available

### Scan Picking Notifications
- `SCAN_PICKING_COMPLETED` - Scan picking completed
- `SCAN_PICKING_INSPECTION_READY` - Scan picking ready for inspection

### Pallet Notifications
- `PALLET_QUANTITY_UPDATED` - Pallet quantity updated
- `PALLET_FULL` - Pallet is full
- `PALLET_EMPTY` - Pallet is empty
- `PALLET_MOVED` - Pallet moved to new location

### System Notifications
- `SYSTEM_ALERT` - System alert
- `SYSTEM_ERROR` - System error
- `SYSTEM_WARNING` - System warning
- `SYSTEM_INFO` - System information

## Notification Priority Levels

- `LOW` - General updates, non-urgent
- `MEDIUM` - Standard notifications
- `HIGH` - Important notifications requiring attention
- `URGENT` - Critical alerts requiring immediate action

## Notification Structure

### Base Notification
```typescript
{
  type: 'INBOUND_CREATED',
  title: 'Inbound Baru Dibuat',
  message: 'Inbound INB-2025-001 dari JNE telah dibuat',
  priority: 'MEDIUM',
  entityId: '550e8400-e29b-41d4-a716-446655440000',
  entityType: 'inbound',
  timestamp: '2025-11-11T08:30:00.000Z',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  username: 'john_doe',
  metadata: {
    // Additional context-specific data
  },
  rooms: ['warehouse_123', 'role:SUPERVISOR']
}
```

### Inbound Notification Example
```typescript
{
  type: 'INBOUND_CREATED',
  title: 'Inbound Baru Dibuat',
  message: 'Inbound INB-2025-001 dari JNE telah dibuat',
  priority: 'MEDIUM',
  entityId: '550e8400-e29b-41d4-a716-446655440000',
  entityType: 'inbound',
  inboundNumber: 'INB-2025-001',
  status: 'CREATED',
  expedition: 'JNE',
  timestamp: '2025-11-11T08:30:00.000Z',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  username: 'john_doe'
}
```

### Picking Notification Example
```typescript
{
  type: 'PICKING_ASSIGNED',
  title: 'Tugas Picking Baru',
  message: 'Picking ITEM-001 (100 unit) ditugaskan ke Ahmad',
  priority: 'HIGH',
  entityId: '550e8400-e29b-41d4-a716-446655440000',
  entityType: 'picking',
  itemSku: 'ITEM-001',
  quantity: 100,
  sourceWarehouseSub: 'Zone A',
  sourceBin: 'A1-01',
  timestamp: '2025-11-11T08:30:00.000Z',
  metadata: {
    assignedTo: 'Ahmad',
    location: 'Zone A - Bin A1-01'
  }
}
```

## Frontend Integration Examples

### Vue.js Example
```vue
<template>
  <div>
    <div v-for="notification in notifications" :key="notification.timestamp">
      <NotificationCard :notification="notification" />
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      notifications: [],
    };
  },
  mounted() {
    this.socket = io('http://localhost:3000/notifications');
    
    this.socket.on('notification', (notification) => {
      this.notifications.push(notification);
      this.showToast(notification);
    });

    // Join warehouse-specific room
    this.socket.emit('join_room', { room: 'warehouse_123' });
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.close();
    }
  },
  methods: {
    showToast(notification) {
      // Show toast notification based on priority
      const type = {
        'LOW': 'info',
        'MEDIUM': 'success',
        'HIGH': 'warning',
        'URGENT': 'error',
      }[notification.priority];
      
      this.$toast[type](notification.message);
    }
  }
};
</script>
```

### Angular Example
```typescript
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private socket: Socket;
  private notificationSubject = new Subject<any>();

  constructor() {
    this.socket = io('http://localhost:3000/notifications');
    
    this.socket.on('notification', (notification) => {
      this.notificationSubject.next(notification);
    });
  }

  getNotifications(): Observable<any> {
    return this.notificationSubject.asObservable();
  }

  joinRoom(room: string): void {
    this.socket.emit('join_room', { room });
  }

  leaveRoom(room: string): void {
    this.socket.emit('leave_room', { room });
  }
}
```

## Server-Side Usage

### Sending Notifications from Services

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class InboundService {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateInboundDto): Promise<Inbound> {
    const inbound = await this.repository.create(dto);

    // Send notification
    this.notificationService.notifyInboundCreated({
      inboundId: inbound.id,
      inboundNumber: inbound.inbound_number,
      expedition: inbound.expedition,
      userId: dto.userId,
      username: dto.username,
      rooms: ['warehouse_123', 'organization_456'],
    });

    return inbound;
  }
}
```

### Custom Notification Example
```typescript
// Send to specific room
this.notificationService.sendToRoom('warehouse_123', {
  type: NotificationType.CUSTOM_EVENT,
  title: 'Custom Event',
  message: 'Something happened',
  priority: NotificationPriority.MEDIUM,
  entityType: 'custom',
  timestamp: new Date().toISOString(),
});

// Broadcast to all
this.notificationService.sendToAll({
  type: NotificationType.SYSTEM_ALERT,
  title: 'System Maintenance',
  message: 'System akan maintenance dalam 10 menit',
  priority: NotificationPriority.URGENT,
  entityType: 'system',
  timestamp: new Date().toISOString(),
});
```

### Send to Role Clusters
```typescript
this.notificationService.sendToRoles(['WAREHOUSE_MANAGER'], {
  type: NotificationType.PICKING_ASSIGNED,
  title: 'Tugas Picking Baru',
  message: 'Tim picking menerima tugas baru',
  priority: NotificationPriority.HIGH,
  entityType: 'picking',
  timestamp: new Date().toISOString(),
});
```

## Health Check

### Ping/Pong
```typescript
socket.emit('ping');

socket.on('pong', (data) => {
  console.log('Server responded at:', data.timestamp);
});
```

## Error Handling

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server disconnected, manually reconnect
    socket.connect();
  }
});
```

## Best Practices

1. **Room Management**
   - Join rooms based on user context (warehouse, organization)
   - Leave rooms when component unmounts or context changes

2. **Subscription Management**
   - Subscribe only to relevant notification types
   - Unsubscribe when no longer needed to reduce bandwidth

3. **Connection Management**
   - Implement reconnection logic with exponential backoff
   - Clean up socket connections when components unmount

4. **Notification Handling**
   - Filter notifications based on priority and type
   - Implement proper UI feedback (toasts, badges, sounds)
   - Store notifications for history/replay

5. **Security**
   - Implement JWT authentication for WebSocket connections
   - Validate user permissions for room access
   - Rate limit notification emissions

6. **Performance**
   - Batch notifications when appropriate
   - Debounce high-frequency updates
   - Use rooms to reduce unnecessary broadcasts

## Testing

### Testing with Postman or Socket.IO Client

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000/notifications');

socket.on('connect', () => {
  console.log('Connected!');
  
  // Join a room
  socket.emit('join_room', { room: 'test_room' });
  
  // Subscribe to notification types
  socket.emit('subscribe', { 
    types: ['INBOUND_CREATED', 'PICKING_ASSIGNED'] 
  });
});

socket.on('notification', (notification) => {
  console.log('Received notification:', JSON.stringify(notification, null, 2));
});

socket.on('room_joined', (data) => {
  console.log('Room joined:', data);
});
```

## Troubleshooting

### Connection Issues
- Verify server is running
- Check CORS configuration
- Ensure firewall allows WebSocket connections
- Check network proxy settings

### Not Receiving Notifications
- Verify room membership
- Check notification type subscriptions
- Ensure notification is being sent to correct room
- Check browser console for errors

### Performance Issues
- Reduce number of active subscriptions
- Implement client-side notification batching
- Use rooms instead of broadcasting to all clients
- Monitor server memory usage

## Environment Configuration

Add to your `.env` file:

```env
# WebSocket Configuration
WS_PORT=3000
WS_CORS_ORIGIN=http://localhost:5173
WS_NAMESPACE=/notifications
```

## Support

For issues or questions, please refer to the main WMS documentation or contact the development team.

