import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JoinRoomDto, LeaveRoomDto, JoinRolesDto, LeaveRolesDto } from './dto/websocket.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this based on your frontend URL in production
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private readonly notificationService: NotificationService) {}

  private normalizeRoles(input: string | string[] | Record<string, any> | undefined): string[] {
    if (!input) {
      return [];
    }

    const candidates = Array.isArray(input) ? input : [input];

    const roles = candidates
      .map((candidate) => {
        if (!candidate) return null;
        if (typeof candidate === 'string') return candidate;
        if (typeof candidate === 'object') {
          if ('role' in candidate && candidate.role) return String(candidate.role);
          if ('value' in candidate && candidate.value) return String(candidate.value);
          if ('name' in candidate && candidate.name) return String(candidate.name);
        }
        return null;
      })
      .filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
      .map((role) => role.trim());

    return Array.from(new Set(roles));
  }

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
    this.notificationService.setServer(this.server);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Send connection success message
    client.emit('connected', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
      message: 'Successfully connected to WMS notification server',
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client joins a specific room to receive targeted notifications
   * Rooms can be: warehouse_id, user_id, organization_id, etc.
   */
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ) {
    const { room } = data;
    client.join(room);
    
    // If joining a user room, store userId in socket.data for recipient tracking
    if (room.startsWith('user_')) {
      const userId = room.replace(/^user_/, '');
      client.data.userId = userId;
    }
    
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    
    return {
      event: 'room_joined',
      data: {
        room,
        message: `Successfully joined room: ${room}`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Client leaves a specific room
   */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LeaveRoomDto,
  ) {
    const { room } = data;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    
    return {
      event: 'room_left',
      data: {
        room,
        message: `Successfully left room: ${room}`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Client subscribes to specific notification types
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { types: string[] },
  ) {
    const { types } = data;
    types.forEach((type) => {
      client.join(`notification_type:${type}`);
    });
    
    this.logger.log(`Client ${client.id} subscribed to: ${types.join(', ')}`);
    
    return {
      event: 'subscribed',
      data: {
        types,
        message: `Successfully subscribed to notification types`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Client unsubscribes from specific notification types
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { types: string[] },
  ) {
    const { types } = data;
    types.forEach((type) => {
      client.leave(`notification_type:${type}`);
    });
    
    this.logger.log(`Client ${client.id} unsubscribed from: ${types.join(', ')}`);
    
    return {
      event: 'unsubscribed',
      data: {
        types,
        message: `Successfully unsubscribed from notification types`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Ping/pong for connection health check
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return {
      event: 'pong',
      data: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Client joins role based rooms
   */
  @SubscribeMessage('join_roles')
  handleJoinRoles(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRolesDto | { roles: string | string[] },
  ) {
    const roles = this.normalizeRoles(data.roles);
    roles.forEach((role) => {
      const room = `role:${role}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined role room: ${room}`);
    });

    return {
      event: 'roles_joined',
      data: {
        roles,
        message: 'Successfully joined role rooms',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Client leaves role based rooms
   */
  @SubscribeMessage('leave_roles')
  handleLeaveRoles(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LeaveRolesDto | { roles: string | string[] },
  ) {
    const roles = this.normalizeRoles(data.roles);
    roles.forEach((role) => {
      const room = `role:${role}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} left role room: ${room}`);
    });

    return {
      event: 'roles_left',
      data: {
        roles,
        message: 'Successfully left role rooms',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

