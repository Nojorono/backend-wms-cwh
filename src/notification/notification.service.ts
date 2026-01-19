import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  BaseNotificationDto,
  InboundNotificationDto,
  OutboundMemoNotificationDto,
  OutboundDoNotificationDto,
  PickingNotificationDto,
  PalletNotificationDto,
  InventoryNotificationDto,
  SystemNotificationDto,
  NotificationType,
  NotificationPriority,
} from './dto/websocket.dto';
import { NotificationHistoryRepository } from './notification-history.repository';

@Injectable()
export class NotificationService {
  private server: Server;
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly historyRepository: NotificationHistoryRepository,
  ) {}

  setServer(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server set in NotificationService');
  }

  /**
   * Send notification to all connected clients
   */
  async sendToAll(notification: BaseNotificationDto) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    // Save to history
    try {
      await this.historyRepository.create({
        ...notification,
        isBroadcast: true,
      });
    } catch (error) {
      this.logger.error(`Failed to save notification to history: ${error.message}`);
    }

    this.server.emit('notification', notification);
    this.logger.log(`Broadcast notification: ${notification.type}`);
  }

  /**
   * Send notification to specific room(s)
   */
  async sendToRoom(rooms: string | string[], notification: BaseNotificationDto) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    const roomArray = Array.isArray(rooms) ? rooms : [rooms];

    // Get all socket IDs in role rooms and extract user IDs from their data
    const roleRoomRecipients: string[] = [];
    for (const room of roomArray) {
      if (room.startsWith('role:')) {
        try {
          const sockets = await this.server.in(room).fetchSockets();
          sockets.forEach((socket) => {
            // Extract userId from socket.data if available
            if (socket.data?.userId) {
              roleRoomRecipients.push(socket.data.userId);
            }
          });
        } catch (error) {
          this.logger.warn(`Failed to fetch sockets for room ${room}: ${error.message}`);
        }
      }
    }

    const recipients = Array.from(
      new Set([
        ...(notification.recipients || []),
        ...roleRoomRecipients,
      ]),
    );

    const payload: BaseNotificationDto = {
      ...notification,
      rooms: Array.from(
        new Set([...(notification.rooms || []), ...roomArray]),
      ),
      recipients,
    };

    // Save to history
    try {
      await this.historyRepository.create({
        ...payload,
        isBroadcast: false,
      });
    } catch (error) {
      this.logger.error(`Failed to save notification to history: ${error.message}`);
    }

    roomArray.forEach((room) => {
      this.server.to(room).emit('notification', payload);
      this.logger.log(`Sent notification to room ${room}: ${notification.type}`);
    });
  }

  /**
   * Send notification to specific client by socket ID
   */
  async sendToClient(clientId: string, notification: BaseNotificationDto) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    const recipients = Array.from(
      new Set([
        ...(notification.recipients || []),
        clientId,
      ]),
    );

    const payload: BaseNotificationDto = {
      ...notification,
      recipients,
    };

    try {
      await this.historyRepository.create({
        ...payload,
        isBroadcast: false,
      });
    } catch (error) {
      this.logger.error(`Failed to save notification to history: ${error.message}`);
    }

    this.server.to(clientId).emit('notification', payload);
    this.logger.log(`Sent notification to client ${clientId}: ${notification.type}`);
  }

  /**
   * Send notification by type (to subscribers of that type)
   */
  async sendByType(notification: BaseNotificationDto) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    // If notification has userId, add to recipients
    const recipients = notification.userId 
      ? Array.from(new Set([...(notification.recipients || []), notification.userId]))
      : notification.recipients;

    const payload: BaseNotificationDto = {
      ...notification,
      recipients,
    };

    try {
      await this.historyRepository.create({
        ...payload,
        isBroadcast: false,
      });
    } catch (error) {
      this.logger.error(`Failed to save notification to history: ${error.message}`);
    }

    const room = `notification_type:${notification.type}`;
    this.server.to(room).emit('notification', payload);
    this.logger.log(`Sent notification to type room ${room}`);
  }

  /**
   * Send notification to role-based rooms
   */
  async sendToRoles(roles: string | string[], notification: BaseNotificationDto) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const roleRooms = roleArray.map((role) => `role:${role}`);
    await this.sendToRoom(roleRooms, {
      ...notification,
      rooms: notification.rooms
        ? Array.from(new Set([...(notification.rooms || []), ...roleRooms]))
        : roleRooms,
    });
  }

  // ==================== INBOUND NOTIFICATIONS ====================

  notifyInboundCreated(data: {
    inboundId: string;
    inboundNumber: string;
    expedition: string;
    userId?: string;
    username?: string;
    rooms?: string[];
  }): void {
    const notification: InboundNotificationDto = {
      type: NotificationType.INBOUND_CREATED,
      title: 'Inbound Baru Dibuat',
      message: `Inbound ${data.inboundNumber} dari ${data.expedition} telah dibuat`,
      priority: NotificationPriority.MEDIUM,
      entityId: data.inboundId,
      entityType: 'inbound',
      inboundNumber: data.inboundNumber,
      expedition: data.expedition,
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      rooms: data.rooms,
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyInboundStatusChanged(data: {
    inboundId: string;
    inboundNumber: string;
    oldStatus: string;
    newStatus: string;
    userId?: string;
    username?: string;
    rooms?: string[];
  }): void {
    const notification: InboundNotificationDto = {
      type: NotificationType.INBOUND_STATUS_CHANGED,
      title: 'Status Inbound Berubah',
      message: `Inbound ${data.inboundNumber} berubah dari ${data.oldStatus} ke ${data.newStatus}`,
      priority: NotificationPriority.MEDIUM,
      entityId: data.inboundId,
      entityType: 'inbound',
      inboundNumber: data.inboundNumber,
      status: data.newStatus,
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      metadata: { oldStatus: data.oldStatus, newStatus: data.newStatus },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyInboundInspectionReady(data: {
    inboundId: string;
    inboundNumber: string;
    totalItems: number;
    userId?: string;
    username?: string;
    rooms?: string[];
  }): void {
    const notification: InboundNotificationDto = {
      type: NotificationType.INBOUND_INSPECTION_READY,
      title: 'Inbound Siap Inspeksi',
      message: `Inbound ${data.inboundNumber} dengan ${data.totalItems} item siap untuk inspeksi`,
      priority: NotificationPriority.HIGH,
      entityId: data.inboundId,
      entityType: 'inbound',
      inboundNumber: data.inboundNumber,
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      metadata: { totalItems: data.totalItems },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyInboundInspectionApproved(data: {
    inboundId: string;
    inboundNumber: string;
    palletId: string;
    warehouseId: string;
    warehouseSubId: string;
    approvedBy?: string;
    rooms?: string[];
  }): void {
    const notification: InboundNotificationDto = {
      type: NotificationType.INBOUND_INSPECTION_APPROVED,
      title: 'Inspeksi Inbound Disetujui',
      message: `Inbound ${data.inboundNumber} telah lulus inspeksi`,
      priority: NotificationPriority.HIGH,
      entityId: data.inboundId,
      entityType: 'inbound',
      inboundNumber: data.inboundNumber,
      status: 'INSPECTION_APPROVED',
      timestamp: new Date().toISOString(),
      username: data.approvedBy,
      metadata: {
        palletId: data.palletId,
        warehouseId: data.warehouseId,
        warehouseSubId: data.warehouseSubId,
      },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  // ==================== OUTBOUND NOTIFICATIONS ====================

  notifyOutboundMemoCreated(data: {
    memoId: string;
    requestor: string;
    destination: string;
    totalItems: number;
    userId?: string;
    username?: string;
    rooms?: string[];
  }): void {
    const notification: OutboundMemoNotificationDto = {
      type: NotificationType.OUTBOUND_MEMO_CREATED,
      title: 'Memo Outbound Baru',
      message: `Memo dari ${data.requestor} ke ${data.destination} telah dibuat`,
      priority: NotificationPriority.MEDIUM,
      entityId: data.memoId,
      entityType: 'outbound_memo',
      requestor: data.requestor,
      destination: data.destination,
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      metadata: { totalItems: data.totalItems },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyOutboundMemoApproved(data: {
    memoId: string;
    requestor: string;
    approvedBy?: string;
    rooms?: string[];
  }): void {
    const notification: OutboundMemoNotificationDto = {
      type: NotificationType.OUTBOUND_MEMO_APPROVED,
      title: 'Memo Outbound Disetujui',
      message: `Memo dari ${data.requestor} telah disetujui`,
      priority: NotificationPriority.HIGH,
      entityId: data.memoId,
      entityType: 'outbound_memo',
      requestor: data.requestor,
      status: 'APPROVED',
      timestamp: new Date().toISOString(),
      username: data.approvedBy,
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyOutboundDoCreated(data: {
    doId: string;
    doNumber: string;
    expedition: string;
    driverName: string;
    totalMemos: number;
    userId?: string;
    username?: string;
    rooms?: string[];
  }): void {
    const notification: OutboundDoNotificationDto = {
      type: NotificationType.OUTBOUND_DO_CREATED,
      title: 'DO Outbound Baru',
      message: `DO ${data.doNumber} untuk ${data.expedition} telah dibuat dengan ${data.totalMemos} memo`,
      priority: NotificationPriority.MEDIUM,
      entityId: data.doId,
      entityType: 'outbound_do',
      outboundDoNumber: data.doNumber,
      expedition: data.expedition,
      driverName: data.driverName,
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      metadata: { totalMemos: data.totalMemos },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyOutboundDoStatusChanged(data: {
    doId: string;
    doNumber: string;
    oldStatus: string;
    newStatus: string;
    userId?: string;
    username?: string;
    rooms?: string[];
  }): void {
    const notification: OutboundDoNotificationDto = {
      type: NotificationType.OUTBOUND_DO_STATUS_CHANGED,
      title: 'Status DO Berubah',
      message: `DO ${data.doNumber} berubah dari ${data.oldStatus} ke ${data.newStatus}`,
      priority: NotificationPriority.MEDIUM,
      entityId: data.doId,
      entityType: 'outbound_do',
      outboundDoNumber: data.doNumber,
      status: data.newStatus,
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      metadata: { oldStatus: data.oldStatus, newStatus: data.newStatus },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  // ==================== PICKING NOTIFICATIONS ====================

  notifyPickingAssigned(data: {
    pickingId: string;
    itemSku: string;
    quantity: number;
    assignedTo: string;
    location: string;
    rooms?: string[];
  }): void {
    const notification: PickingNotificationDto = {
      type: NotificationType.PICKING_ASSIGNED,
      title: 'Tugas Picking Baru',
      message: `Picking ${data.itemSku} (${data.quantity} unit) ditugaskan ke ${data.assignedTo}`,
      priority: NotificationPriority.HIGH,
      entityId: data.pickingId,
      entityType: 'picking',
      itemSku: data.itemSku,
      quantity: data.quantity,
      timestamp: new Date().toISOString(),
      metadata: { assignedTo: data.assignedTo, location: data.location },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyPickingCompleted(data: {
    pickingId: string;
    itemSku: string;
    quantity: number;
    completedBy?: string;
    rooms?: string[];
  }): void {
    const notification: PickingNotificationDto = {
      type: NotificationType.PICKING_COMPLETED,
      title: 'Picking Selesai',
      message: `Picking ${data.itemSku} (${data.quantity} unit) telah selesai`,
      priority: NotificationPriority.MEDIUM,
      entityId: data.pickingId,
      entityType: 'picking',
      itemSku: data.itemSku,
      quantity: data.quantity,
      timestamp: new Date().toISOString(),
      username: data.completedBy,
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyPickingSuggestionReady(data: {
    memoId: string;
    itemCount: number;
    totalQuantity: number;
    rooms?: string[];
  }): void {
    const notification: BaseNotificationDto = {
      type: NotificationType.PICKING_SUGGESTION_READY,
      title: 'Saran Picking Tersedia',
      message: `Saran picking untuk ${data.itemCount} item (total ${data.totalQuantity} unit) telah dibuat`,
      priority: NotificationPriority.MEDIUM,
      entityId: data.memoId,
      entityType: 'picking_suggestion',
      timestamp: new Date().toISOString(),
      metadata: { itemCount: data.itemCount, totalQuantity: data.totalQuantity },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  // ==================== PALLET NOTIFICATIONS ====================

  notifyPalletQuantityUpdated(data: {
    palletId: string;
    palletCode: string;
    oldQuantity: number;
    newQuantity: number;
    operation: string;
    userId?: string;
    username?: string;
    rooms?: string[];
  }): void {
    const notification: PalletNotificationDto = {
      type: NotificationType.PALLET_QUANTITY_UPDATED,
      title: 'Quantity Pallet Diupdate',
      message: `Pallet ${data.palletCode} diupdate dari ${data.oldQuantity} ke ${data.newQuantity} (${data.operation})`,
      priority: NotificationPriority.LOW,
      entityId: data.palletId,
      entityType: 'pallet',
      palletCode: data.palletCode,
      quantity: data.newQuantity,
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      metadata: { oldQuantity: data.oldQuantity, operation: data.operation },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyPalletFull(data: {
    palletId: string;
    palletCode: string;
    capacity: number;
    location: string;
    rooms?: string[];
  }): void {
    const notification: PalletNotificationDto = {
      type: NotificationType.PALLET_FULL,
      title: 'Pallet Penuh',
      message: `Pallet ${data.palletCode} telah penuh (${data.capacity} unit) di ${data.location}`,
      priority: NotificationPriority.HIGH,
      entityId: data.palletId,
      entityType: 'pallet',
      palletCode: data.palletCode,
      capacity: data.capacity,
      location: data.location,
      timestamp: new Date().toISOString(),
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  // ==================== INVENTORY NOTIFICATIONS ====================

  notifyInventoryLowStock(data: {
    itemId: string;
    itemDescription: string;
    currentStock: number;
    minimumStock: number;
    location: string;
    rooms?: string[];
  }): void {
    const notification: InventoryNotificationDto = {
      type: NotificationType.INVENTORY_LOW_STOCK,
      title: 'Stok Rendah',
      message: `${data.itemDescription} memiliki stok rendah (${data.currentStock} unit) di ${data.location}`,
      priority: NotificationPriority.HIGH,
      entityId: data.itemId,
      entityType: 'inventory',
      itemDescription: data.itemDescription,
      currentStock: data.currentStock,
      minimumStock: data.minimumStock,
      location: data.location,
      timestamp: new Date().toISOString(),
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyInventoryLocationChanged(data: {
    palletId: string;
    oldLocation: string;
    newLocation: string;
    userId?: string;
    username?: string;
    rooms?: string[];
  }): void {
    const notification: InventoryNotificationDto = {
      type: NotificationType.INVENTORY_LOCATION_CHANGED,
      title: 'Lokasi Inventory Berubah',
      message: `Pallet dipindahkan dari ${data.oldLocation} ke ${data.newLocation}`,
      priority: NotificationPriority.MEDIUM,
      entityId: data.palletId,
      entityType: 'inventory',
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.username,
      metadata: { oldLocation: data.oldLocation, newLocation: data.newLocation },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  // ==================== PUT AWAY NOTIFICATIONS ====================

  notifyPutAwayAssigned(data: {
    putAwayId: string;
    palletCode: string;
    destinationBin: string;
    driverName: string;
    rooms?: string[];
  }): void {
    const notification: BaseNotificationDto = {
      type: NotificationType.PUT_AWAY_ASSIGNED,
      title: 'Tugas Put Away Baru',
      message: `Put away pallet ${data.palletCode} ke ${data.destinationBin} ditugaskan ke ${data.driverName}`,
      priority: NotificationPriority.HIGH,
      entityId: data.putAwayId,
      entityType: 'put_away',
      timestamp: new Date().toISOString(),
      metadata: { palletCode: data.palletCode, destinationBin: data.destinationBin, driverName: data.driverName },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  notifyPutAwayCompleted(data: {
    putAwayId: string;
    palletCode: string;
    destinationBin: string;
    completedBy: string;
    rooms?: string[];
  }): void {
    const notification: BaseNotificationDto = {
      type: NotificationType.PUT_AWAY_COMPLETED,
      title: 'Put Away Selesai',
      message: `Pallet ${data.palletCode} telah ditempatkan di ${data.destinationBin}`,
      priority: NotificationPriority.MEDIUM,
      entityId: data.putAwayId,
      entityType: 'put_away',
      timestamp: new Date().toISOString(),
      username: data.completedBy,
      metadata: { palletCode: data.palletCode, destinationBin: data.destinationBin },
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendByType(notification);
    }
  }

  // ==================== SYSTEM NOTIFICATIONS ====================

  notifySystemAlert(data: {
    title: string;
    message: string;
    priority?: NotificationPriority;
    errorCode?: string;
    rooms?: string[];
  }): void {
    const notification: SystemNotificationDto = {
      type: NotificationType.SYSTEM_ALERT,
      title: data.title,
      message: data.message,
      priority: data.priority || NotificationPriority.MEDIUM,
      entityType: 'system',
      timestamp: new Date().toISOString(),
      errorCode: data.errorCode,
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendToAll(notification);
    }
  }

  notifySystemError(data: {
    title: string;
    message: string;
    errorCode?: string;
    stackTrace?: string;
    rooms?: string[];
  }): void {
    const notification: SystemNotificationDto = {
      type: NotificationType.SYSTEM_ERROR,
      title: data.title,
      message: data.message,
      priority: NotificationPriority.URGENT,
      entityType: 'system',
      timestamp: new Date().toISOString(),
      errorCode: data.errorCode,
      stackTrace: data.stackTrace,
    };

    if (data.rooms) {
      this.sendToRoom(data.rooms, notification);
    } else {
      this.sendToAll(notification);
    }
  }
}

