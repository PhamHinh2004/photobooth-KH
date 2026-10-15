import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: true },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const rawToken = client.handshake.auth?.token || client.handshake.query?.token;
    if (!rawToken) {
      this.logger.debug(`No token provided for client on /notifications: ${client.id}`);
      return;
    }

    try {
      const tokenStr = typeof rawToken === 'string' ? rawToken : String(rawToken);
      const cleanToken = tokenStr.startsWith('Bearer ') ? tokenStr.slice(7) : tokenStr;
      const payload = this.jwtService.verify(cleanToken);
      const accountId = payload?.sub || payload?.id;

      if (!accountId) {
        this.logger.debug(`Token missing subject for client: ${client.id}`);
        return;
      }

      client.data.user = payload;
      client.join(`account:${accountId}`);
      this.logger.debug(`Client ${client.id} joined notification room account:${accountId}`);
    } catch (err: any) {
      this.logger.debug(
        `Invalid token on /notifications connection for client ${client.id}: ${err?.message}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected from /notifications: ${client.id}`);
  }

  @OnEvent('notification.created')
  handleNotificationCreated(notification: Notification) {
    if (!notification?.recipient_account_id) return;
    this.server
      .to(`account:${notification.recipient_account_id}`)
      .emit('notification:new', notification);
  }

  @OnEvent('notification.read_all')
  handleNotificationReadAll(payload: { accountId: string }) {
    if (!payload?.accountId) return;
    this.server
      .to(`account:${payload.accountId}`)
      .emit('notification:read_all', payload);
  }

  @OnEvent('notification.read')
  handleNotificationRead(payload: { accountId: string; id: string }) {
    if (!payload?.accountId) return;
    this.server
      .to(`account:${payload.accountId}`)
      .emit('notification:read', payload);
  }
}
