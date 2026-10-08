import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({ namespace: '/rooms', cors: { origin: '*' } })
export class RoomGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) { }

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    try {
      if (token) {
        client.data.user = this.jwtService.verify(token);
      }
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('room:time_sync')
  handleTimeSync() {
    return { serverTime: Date.now() };
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.join(`room:${roomId}`);
  }

  @OnEvent('room.frame_selected')
  onFrameSelected(payload: { roomId: string; frameId: string }) {
    this.server.to(`room:${payload.roomId}`).emit('room:frame_selected', payload);
  }

  @OnEvent('room.participant_joined')
  onParticipantJoined(payload: { roomId: string; participant: any }) {
    this.server.to(`room:${payload.roomId}`).emit('room:participant_joined', payload.participant);
  }

  @OnEvent('room.studio_opened')
  onStudioOpened(payload: { roomId: string }) {
    this.server.to(`room:${payload.roomId}`).emit('room:studio_opened', payload);
  }

  @OnEvent('room.edit_policy_updated')
  onEditPolicyUpdated(payload: { roomId: string; policy: 'host_only' | 'all_participants' }) {
    this.server.to(`room:${payload.roomId}`).emit('room:edit_policy_updated', payload);
  }

  @OnEvent('room.countdown_started')
  onCountdownStarted(payload: { roomId: string; countdownSeconds: number; countdownEndsAt: number; roundIndex: number; totalRounds: number }) {
    this.server.to(`room:${payload.roomId}`).emit('room:countdown_started', payload);
  }

  @OnEvent('room.break_started')
  onBreakStarted(payload: { roomId: string; breakEndsAt: number; roundIndex: number; totalRounds: number }) {
    this.server.to(`room:${payload.roomId}`).emit('room:break_started', payload);
  }

  @OnEvent('room.capture_trigger')
  onCaptureTrigger(payload: { roomId: string; triggerAt: number; roundIndex: number; totalRounds: number }) {
    this.server.to(`room:${payload.roomId}`).emit('room:capture_trigger', payload);
  }

  @OnEvent('room.participant_captured')
  onParticipantCaptured(payload: { roomId: string; slotIndex: number; roundIndex: number; totalRounds: number }) {
    this.server.to(`room:${payload.roomId}`).emit('room:participant_captured', payload);
  }

  @OnEvent('room.all_captured')
  onAllCaptured(payload: { roomId: string; slots: { slotIndex: number; username: string }[] }) {
    this.server.to(`room:${payload.roomId}`).emit('room:all_captured', payload);
  }

  @OnEvent('room.composed_ready')
  onComposedReady(payload: { roomId: string; photo: any; sessionResult: any }) {
    this.server.to(`room:${payload.roomId}`).emit('room:composed_ready', payload);
  }
}
