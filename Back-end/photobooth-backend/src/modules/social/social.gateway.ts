import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/social',
  cors: { origin: true },
})
export class SocialGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(SocialGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    // Optionally verify token if provided, but allow guest connection to view feed
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (token) {
      try {
        const payload = this.jwtService.verify(token as string);
        client.data.user = payload;
      } catch {
        this.logger.debug(`Invalid token for client: ${client.id}`);
      }
    }
    
    this.logger.debug(`Client connected: ${client.id}`);
    client.join('feed');
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:post')
  handleJoinPost(@MessageBody() postId: string, @ConnectedSocket() client: Socket) {
    client.join(`post:${postId}`);
  }

  @SubscribeMessage('leave:post')
  handleLeavePost(@MessageBody() postId: string, @ConnectedSocket() client: Socket) {
    client.leave(`post:${postId}`);
  }

  @OnEvent('post.created')
  handlePostCreated(post: any) {
    this.server.to('feed').emit('post:created', post);
  }

  @OnEvent('post.updated')
  handlePostUpdated(post: any) {
    this.server.to('feed').emit('post:updated', post);
    this.server.to(`post:${post.id}`).emit('post:updated', post);
  }

  @OnEvent('post.deleted')
  handlePostDeleted(postId: string) {
    this.server.to('feed').emit('post:deleted', postId);
    this.server.to(`post:${postId}`).emit('post:deleted', postId);
  }

  @OnEvent('post.liked')
  handlePostLiked(payload: { postId: string; likesCount: number }) {
    this.server.to('feed').emit('post:liked', payload);
    this.server.to(`post:${payload.postId}`).emit('post:liked', payload);
  }

  @OnEvent('comment.created')
  handleCommentCreated(comment: any) {
    this.server.to(`post:${comment.post_id}`).emit('comment:created', comment);
  }

  @OnEvent('comment.updated')
  handleCommentUpdated(comment: any) {
    this.server.to(`post:${comment.post_id}`).emit('comment:updated', comment);
  }

  @OnEvent('comment.deleted')
  handleCommentDeleted(payload: { id: string; postId: string }) {
    this.server.to(`post:${payload.postId}`).emit('comment:deleted', payload.id);
  }
}
