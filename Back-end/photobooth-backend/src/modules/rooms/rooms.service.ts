import { Injectable, BadRequestException, ForbiddenException, GoneException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';

import { Room, RoomStatus } from './entities/room.entity';
import { RoomParticipant, ParticipantStatus } from './entities/room-participant.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomFrameSelectionStore } from './room-frame-selection.store';
import { RoomCaptureStore } from './room-capture.store';
import { StorageService } from '../storage/storage.service';
import { Photo, MediaType, PhotoStatus } from '../photos/entities/photo.entity';
import { SessionResult, SessionResultStatus, SessionType } from '../session-results/entities/session-result.entity';

import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomParticipant) private readonly participantRepository: Repository<RoomParticipant>,
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    @InjectRepository(SessionResult) private readonly sessionResultRepository: Repository<SessionResult>,
    private readonly storageService: StorageService,
    private readonly frameSelectionStore: RoomFrameSelectionStore,
    private readonly captureStore: RoomCaptureStore,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async getLivekitToken(roomId: string, accountId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');

    const participant = await this.participantRepository.findOne({
      where: { room_id: roomId, account_id: accountId },
      relations: { account: true }
    });
    if (!participant) throw new ForbiddenException('Bạn không ở trong phòng này');

    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: accountId,
      name: participant.account.username || 'Anonymous',
    });

    at.addGrant({ roomJoin: true, room: room.id, canPublish: true, canSubscribe: true });

    return { token: await Promise.resolve(at.toJwt()), url: process.env.LIVEKIT_URL };
  }

  async create(hostAccountId: string, dto: CreateRoomDto) {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // TTL 1 hour by default

    const room = this.roomRepository.create({
      room_code: roomCode,
      host_account_id: hostAccountId,
      max_participants: dto.max_participants,
      countdown_seconds: dto.countdown_seconds || 5,
      status: RoomStatus.SETUP,
      expires_at: expiresAt,
    });

    await this.roomRepository.save(room);

    // Host joins automatically
    const participant = this.participantRepository.create({
      room_id: room.id,
      account_id: hostAccountId,
      is_host: true,
      status: ParticipantStatus.JOINED,
      slot_index: 0,
    });
    await this.participantRepository.save(participant);

    return room;
  }

  async getByCode(code: string) {
    const room = await this.roomRepository.findOne({ where: { room_code: code } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');

    const participants = await this.participantRepository.find({
      where: { room_id: room.id },
      relations: { account: true },
      order: { slot_index: 'ASC' },
    });

    const frame_id = this.frameSelectionStore.get(room.id);

    return { ...room, participants, frame_id };
  }

  async selectFrame(roomId: string, frameId: string) {
    this.frameSelectionStore.set(roomId, frameId);
    this.eventEmitter.emit('room.frame_selected', { roomId, frameId });
    return { roomId, frameId };
  }

  async join(roomId: string, accountId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');
    if (room.status !== RoomStatus.SETUP && room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Phòng không thể tham gia lúc này');
    }

    const participants = await this.participantRepository.find({ where: { room_id: roomId } });
    const existing = participants.find(p => p.account_id === accountId);
    if (existing) return existing;

    if (participants.length >= room.max_participants) {
      throw new BadRequestException('Phòng đã đầy');
    }

    // Assign next available slot
    const slots = participants.map(p => p.slot_index);
    let nextSlot = 0;
    while (slots.includes(nextSlot)) {
      nextSlot++;
    }

    const participant = this.participantRepository.create({
      room_id: room.id,
      account_id: accountId,
      is_host: false,
      status: ParticipantStatus.JOINED,
      slot_index: nextSlot,
    });

    await this.participantRepository.save(participant);

    const result = await this.participantRepository.findOne({ where: { id: participant.id }, relations: { account: true } });
    this.eventEmitter.emit('room.participant_joined', { roomId, participant: result });

    return result;
  }

  async setReady(roomId: string, accountId: string) {
    const participant = await this.participantRepository.findOne({
      where: { room_id: roomId, account_id: accountId },
      relations: { account: true }
    });
    if (!participant) throw new ForbiddenException('Bạn không ở trong phòng này');

    await this.participantRepository.update(participant.id, { status: ParticipantStatus.READY });
    participant.status = ParticipantStatus.READY;

    this.eventEmitter.emit('room.participant_ready', { roomId, participant });
    return participant;
  }

  async assertIsHost(roomId: string, accountId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room || room.host_account_id !== accountId) {
      throw new ForbiddenException('Bạn không phải host của phòng này');
    }
  }

  async startCountdown(roomId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');

    await this.roomRepository.update(roomId, { status: RoomStatus.COUNTDOWN });
    this.eventEmitter.emit('room.countdown_started', { roomId, countdownSeconds: room.countdown_seconds });

    setTimeout(() => {
      const triggerAt = Date.now() + 1000;
      this.roomRepository.update(roomId, { status: RoomStatus.CAPTURING });
      this.eventEmitter.emit('room.capture_trigger', { roomId, triggerAt });
    }, room.countdown_seconds * 1000);

    return { status: 'countdown_started' };
  }

  async submitCapture(roomId: string, accountId: string, file: Buffer) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');

    const participant = await this.participantRepository.findOne({
      where: { room_id: roomId, account_id: accountId },
      relations: { account: true },
    });
    if (!participant) throw new ForbiddenException('Bạn không ở trong phòng này');

    const ttlSeconds = Math.max(600, Math.ceil((room.expires_at.getTime() - Date.now()) / 1000));
    await this.captureStore.save(
      room.room_code,
      participant.account.username || 'anonymous',
      participant.slot_index,
      file,
      ttlSeconds,
    );

    await this.participantRepository.update(participant.id, { status: ParticipantStatus.CAPTURED });
    this.eventEmitter.emit('room.participant_captured', { roomId, slotIndex: participant.slot_index });

    const captured = await this.participantRepository.find({
      where: { room_id: roomId, status: ParticipantStatus.CAPTURED },
      relations: { account: true },
      order: { slot_index: 'ASC' },
    });

    if (captured.length >= room.max_participants) {
      this.eventEmitter.emit('room.all_captured', {
        roomId,
        slots: captured.map((p) => ({ slotIndex: p.slot_index, username: p.account.username || 'anonymous' })),
      });
    }
    return { success: true };
  }

  async getCaptureBuffer(roomId: string, slotIndex: number): Promise<Buffer> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');

    const participant = await this.participantRepository.findOne({
      where: { room_id: roomId, slot_index: slotIndex },
      relations: { account: true },
    });

    const buf = participant && (await this.captureStore.get(room.room_code, participant.account.username || 'anonymous', slotIndex));
    if (!buf) throw new GoneException('Ảnh raw đã hết hạn hoặc chưa có, cần chụp lại');

    return buf;
  }

  async finalizeRoomPhoto(roomId: string, accountId: string, original: Buffer, processed: Buffer, recordingId?: string, gifId?: string) {
    await this.assertIsHost(roomId, accountId);

    const existing = await this.sessionResultRepository.findOne({ where: { room_id: roomId } });
    if (existing) {
      const photo = await this.photoRepository.findOne({ where: { id: existing.photo_id } });
      return { photo, sessionResult: existing };
    }

    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');
    const frameId = this.frameSelectionStore.get(roomId);
    if (!frameId) throw new BadRequestException('Phòng chưa chọn frame');

    const participants = await this.participantRepository.find({
      where: { room_id: roomId, status: ParticipantStatus.CAPTURED },
      relations: { account: true },
    });

    if (participants.length < room.max_participants) {
      throw new BadRequestException('Chưa đủ ảnh từ các slot');
    }

    const [originalUrl, processedUrl] = await Promise.all([
      this.storageService.uploadFile('photos/group', original, 'png'),
      this.storageService.uploadFile('photos/group', processed, 'png'),
    ]);

    const photo = await this.photoRepository.save({
      account_id: room.host_account_id,
      frame_id: frameId,
      media_type: MediaType.PHOTO,
      original_file_url: originalUrl,
      processed_file_url: processedUrl,
      status: PhotoStatus.COMPLETED,
      share_token: randomUUID(),
    });

    const sessionResult = await this.sessionResultRepository.save({
      account_id: room.host_account_id,
      session_type: SessionType.GROUP,
      room_id: room.id,
      photo_id: photo.id,
      recording_id: recordingId,
      gif_id: gifId,
      status: SessionResultStatus.PARTIAL,
    });

    await this.roomRepository.update(roomId, {
      status: RoomStatus.POST_PRODUCTION,
      completed_at: new Date(),
    });
    this.frameSelectionStore.clear(roomId);

    await this.captureStore.deleteMany(
      participants.map((p) => this.captureStore.key(room.room_code, p.account.username || 'anonymous', p.slot_index)),
    );

    this.eventEmitter.emit('room.composed_ready', { roomId, photo, sessionResult });

    return { photo, sessionResult };
  }

  async getResult(roomId: string) {
    const sessionResult = await this.sessionResultRepository.findOne({
      where: { room_id: roomId },
      relations: { photo: true, recording: true, gif: true }
    });
    if (!sessionResult) throw new NotFoundException('Chưa có kết quả');
    return {
      photo: sessionResult.photo,
      recording: sessionResult.recording,
      gif: sessionResult.gif,
      sessionResult
    };
  }
}
