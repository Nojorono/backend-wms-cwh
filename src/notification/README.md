# WebSocket Notification Module

## Quick Start

The WebSocket notification module is ready to use! It provides real-time notifications for all WMS operations.

## Features

✅ **Real-time bidirectional communication**  
✅ **Room-based targeting** (warehouse, user, organization, entity)  
✅ **Role-based clusters** (`role:WAREHOUSE_MANAGER`)  
✅ **Notification type subscriptions**  
✅ **Priority levels** (LOW, MEDIUM, HIGH, URGENT)  
✅ **35+ notification types** covering all WMS operations  
✅ **Type-safe DTOs** with validation  
✅ **Reconnection support**  
✅ **CORS enabled**  

## Server Endpoint

```
ws://localhost:3000/notifications
```

## Using in Your Services

### 1. Inject NotificationService

```typescript
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
      rooms: ['warehouse_123'], // Optional: target specific rooms
    });

    return inbound;
  }
}
```

### 2. Available Notification Methods

#### Inbound
- `notifyInboundCreated()`
- `notifyInboundStatusChanged()`
- `notifyInboundInspectionReady()`

#### Outbound
- `notifyOutboundMemoCreated()`
- `notifyOutboundMemoApproved()`
- `notifyOutboundDoCreated()`
- `notifyOutboundDoStatusChanged()`

#### Picking
- `notifyPickingAssigned()`
- `notifyPickingCompleted()`
- `notifyPickingSuggestionReady()`

#### Pallet
- `notifyPalletQuantityUpdated()`
- `notifyPalletFull()`

#### Inventory
- `notifyInventoryLowStock()`
- `notifyInventoryLocationChanged()`

#### Put Away
- `notifyPutAwayAssigned()`
- `notifyPutAwayCompleted()`

#### System
- `notifySystemAlert()`
- `notifySystemError()`

#### Generic helpers
- `sendToAll()`
- `sendToRoom()`
- `sendToClient()`
- `sendByType()`
- `sendToRoles()`

### 3. Generic Send Methods

```typescript
// Send to all clients
this.notificationService.sendToAll(notification);

// Send to specific room(s)
this.notificationService.sendToRoom('warehouse_123', notification);
this.notificationService.sendToRoom(['warehouse_123', 'org_456'], notification);

// Send to specific client
this.notificationService.sendToClient(clientId, notification);

// Send to all subscribers of a notification type
this.notificationService.sendByType(notification);

// Send to role clusters
this.notificationService.sendToRoles(['WAREHOUSE_MANAGER'], notification);
```

## Client Integration

### React/Next.js Example

```typescript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useWMSNotifications() {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000/notifications');
    
    newSocket.on('connected', (data) => {
      console.log('Connected to WMS notifications');
      
      // Join warehouse room
      newSocket.emit('join_room', { room: 'warehouse_123' });
      
      // Subscribe to specific types
      newSocket.emit('subscribe', { 
        types: ['INBOUND_CREATED', 'PICKING_ASSIGNED', 'PALLET_FULL'] 
      });
    });

    newSocket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      
      // Show toast based on priority
      if (notification.priority === 'URGENT') {
        showUrgentAlert(notification);
      } else {
        showToast(notification);
      }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return { socket, notifications };
}
```

### Vue.js Example

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const socket = ref(null);
const notifications = ref([]);

onMounted(() => {
  socket.value = io('http://localhost:3000/notifications');
  
  socket.value.on('notification', (notification) => {
    notifications.value.unshift(notification);
  });
  
  // Join room
  socket.value.emit('join_room', { room: 'warehouse_123' });
});

onUnmounted(() => {
  socket.value?.close();
});
</script>
```

## Notification Structure

All notifications follow this base structure:

```typescript
{
  type: 'INBOUND_CREATED',           // Notification type (enum)
  title: 'Inbound Baru Dibuat',      // Display title
  message: 'INB-2025-001 dari JNE',  // Display message
  priority: 'MEDIUM',                 // LOW | MEDIUM | HIGH | URGENT
  entityId: 'uuid',                   // Related entity ID
  entityType: 'inbound',              // Entity type
  timestamp: '2025-11-11T08:30:00Z',  // ISO timestamp
  userId: 'uuid',                     // User who triggered
  username: 'john_doe',               // Username
  metadata: {},                       // Additional data
  rooms: ['warehouse_123'],           // Target rooms (optional)
  roles: ['WAREHOUSE_MANAGER']        // Target roles (optional)
}
```

## Notification Types (35+)

### Inbound (6)
- `INBOUND_CREATED`
- `INBOUND_UPDATED`
- `INBOUND_STATUS_CHANGED`
- `INBOUND_DO_VALIDATED`
- `INBOUND_INSPECTION_READY`
- `INBOUND_INSPECTION_APPROVED`

### Scan Inbound (2)
- `SCAN_INBOUND_COMPLETED`
- `SCAN_INBOUND_PENDING`

### Put Away (3)
- `PUT_AWAY_ASSIGNED`
- `PUT_AWAY_COMPLETED`
- `PUT_AWAY_IN_PROGRESS`

### Inventory (3)
- `INVENTORY_UPDATED`
- `INVENTORY_LOW_STOCK`
- `INVENTORY_LOCATION_CHANGED`

### Outbound Memo (4)
- `OUTBOUND_MEMO_CREATED`
- `OUTBOUND_MEMO_APPROVED`
- `OUTBOUND_MEMO_REJECTED`
- `OUTBOUND_MEMO_COMPLETED`

### Outbound DO (4)
- `OUTBOUND_DO_CREATED`
- `OUTBOUND_DO_UPDATED`
- `OUTBOUND_DO_STATUS_CHANGED`
- `OUTBOUND_DO_READY`

### Picking (4)
- `PICKING_ASSIGNED`
- `PICKING_STARTED`
- `PICKING_COMPLETED`
- `PICKING_SUGGESTION_READY`

### Scan Picking (2)
- `SCAN_PICKING_COMPLETED`
- `SCAN_PICKING_INSPECTION_READY`

### Pallet (4)
- `PALLET_QUANTITY_UPDATED`
- `PALLET_FULL`
- `PALLET_EMPTY`
- `PALLET_MOVED`

### System (4)
- `SYSTEM_ALERT`
- `SYSTEM_ERROR`
- `SYSTEM_WARNING`
- `SYSTEM_INFO`

## Room Conventions

Use these naming conventions for rooms:

```typescript
`warehouse_${warehouseId}`     // Warehouse-specific
`user_${userId}`               // User-specific
`organization_${orgId}`        // Organization-specific
`do_${outboundDoId}`          // DO-specific
`memo_${memoId}`              // Memo-specific
`picking_${pickingId}`        // Picking-specific
```

## Testing

### Using Postman/Insomnia

1. Create a new WebSocket request
2. Connect to: `ws://localhost:3000/notifications`
3. Send events:

```json
// Join room
{ "event": "join_room", "data": { "room": "warehouse_123" } }

// Subscribe
{ "event": "subscribe", "data": { "types": ["INBOUND_CREATED"] } }

// Ping
{ "event": "ping" }
```

### Using Node.js Script

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000/notifications');

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('join_room', { room: 'test_room' });
});

socket.on('notification', (notification) => {
  console.log('Notification:', notification);
});
```

## Best Practices

1. **Always join rooms** based on user context (warehouse, organization)
2. **Subscribe to relevant types only** to reduce bandwidth
3. **Clean up connections** when components unmount
4. **Handle reconnection** with exponential backoff
5. **Show notifications based on priority** (urgent = modal, high = toast, etc.)
6. **Store notifications** for history/replay functionality

## Documentation

For complete documentation, see:
- [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md) - Full API reference
- [Notification Types](./dto/websocket.dto.ts) - All available notification types

## Module Structure

```
src/notification/
├── notification.gateway.ts      # WebSocket gateway
├── notification.service.ts      # Notification service
├── notification.module.ts       # Module definition
├── dto/
│   └── websocket.dto.ts         # DTOs and types
├── README.md                    # This file
└── WEBSOCKET_DOCUMENTATION.md   # Complete documentation
```

## Support

The notification module is fully integrated and ready to use. Just inject `NotificationService` in any service where you need to send notifications!

