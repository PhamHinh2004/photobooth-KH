import { Injectable, BadRequestException, ForbiddenException, GoneException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';

import { Room, RoomStatus } from './entities/room.entity';
import { RoomParticipant, ParticipantStatus } from './entities/room-participant.entity';
import { Frame } from '../frames/entities/frame.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomFrameSelectionStore } from './room-frame-selection.store';
import { RoomCaptureStore, RoomEditPolicy } from './room-capture.store';
import { StorageService } from '../storage/storage.service';
import { Photo, MediaType, PhotoStatus } from '../photos/entities/photo.entity';
import { SessionResult, SessionResultStatus, SessionType } from '../session-results/entities/session-result.entity';
import { CustomersService } from '../customers/customers.service';

import { AccessToken } from 'livekit-server-sdk';

const GROUP_COUNTDOWN_SECONDS = 10;
const GROUP_ROUND_BREAK_SECONDS = 2;

interface CaptureSequence {
  currentRound: number;
  totalRounds: number;
  totalSlots: number;
  complete: boolean;
  capturesByRound: Map<number, Set<string>>;
  pendingByRound: Map<number, Set<string>>;
  timer: ReturnType<typeof setTimeout> | null;
}

@Injectable()
export class RoomsService {
  private readonly captureSequences = new Map<string, CaptureSequence>();

  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomParticipant) private readonly participantRepository: Repository<RoomParticipant>,
    @InjectRepository(Frame) private readonly frameRepository: Repository<Frame>,
    @InjectRepository(Photo) private readonly photoRepository: Repository<Photo>,
    @InjectRepository(SessionResult) private readonly sessionResultRepository: Repository<SessionResult>,
    private readonly storageService: StorageService,
    private readonly frameSelectionStore: RoomFrameSelectionStore,
    private readonly captureStore: RoomCaptureStore,
    private readonly eventEmitter: EventEmitter2,
    private readonly customersService: CustomersService,
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
      identity: `${accountId}:${randomUUID()}`,
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
      name: dto.name?.trim() || 'Phòng nhóm',
      host_account_id: hostAccountId,
      max_participants: dto.max_participants,
      countdown_seconds: dto.countdown_seconds || 5,
      status: RoomStatus.SETUP,
      expires_at: expiresAt,
    });

    await this.roomRepository.save(room);
    await this.captureStore.setEditPolicy(room.room_code, 'all_participants', Math.max(600, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)));

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
    const edit_policy = await this.captureStore.getEditPolicy(room.room_code);

    return { ...room, participants, frame_id, edit_policy };
  }

  async setEditPolicy(roomId: string, accountId: string, policy: RoomEditPolicy) {
    if (policy !== 'host_only' && policy !== 'all_participants') {
      throw new BadRequestException('Chế độ chỉnh ảnh không hợp lệ');
    }
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');
    if (room.host_account_id !== accountId) throw new ForbiddenException('Chỉ chủ phòng được đổi quyền chỉnh ảnh');
    if (room.status !== RoomStatus.SETUP && room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Không thể đổi quyền sau khi buổi chụp bắt đầu');
    }

    const ttlSeconds = Math.max(600, Math.ceil((room.expires_at.getTime() - Date.now()) / 1000));
    await this.captureStore.setEditPolicy(room.room_code, policy, ttlSeconds);
    this.eventEmitter.emit('room.edit_policy_updated', { roomId, policy });
    return { roomId, edit_policy: policy };
  }

  private async assertCanEditRoom(roomId: string, accountId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');
    const isHost = room.host_account_id === accountId;
    const policy = await this.captureStore.getEditPolicy(room.room_code);
    if (!isHost) {
      const participant = await this.participantRepository.findOne({ where: { room_id: roomId, account_id: accountId } });
      if (!participant || policy !== 'all_participants') {
        throw new ForbiddenException('Chỉ chủ phòng được chỉnh ảnh trong phòng này');
      }
    }
    return { room, policy };
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

  async openStudio(roomId: string, accountId: string) {
    await this.assertIsHost(roomId, accountId);
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');
    if (room.status !== RoomStatus.SETUP && room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Phòng đã bắt đầu chụp');
    }

    const participants = await this.participantRepository.find({ where: { room_id: roomId } });
    if (participants.length !== room.max_participants || participants.some((participant) => participant.status !== ParticipantStatus.READY)) {
      throw new BadRequestException('Tất cả thành viên cần vào phòng và bật camera trước');
    }

    await this.roomRepository.update(roomId, { status: RoomStatus.WAITING });
    this.eventEmitter.emit('room.studio_opened', { roomId });
    return { status: 'studio_opened' };
  }

  async startCountdown(roomId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');

    if (this.captureSequences.has(roomId)) {
      throw new BadRequestException('Buổi chụp này đã bắt đầu');
    }

    const frameId = this.frameSelectionStore.get(roomId);
    if (!frameId) throw new BadRequestException('Phòng chưa chọn frame');
    const frame = await this.frameRepository.findOne({ where: { id: frameId } });
    if (!frame) throw new NotFoundException('Không tìm thấy frame của phòng');

    const totalSlots = frame.layout_config?.slots?.length ?? 0;
    if (totalSlots < room.max_participants || totalSlots % room.max_participants !== 0) {
      throw new BadRequestException('Số ô của frame phải chia hết cho số thành viên');
    }

    const participants = await this.participantRepository.find({ where: { room_id: roomId } });
    if (participants.length !== room.max_participants || participants.some((participant) => participant.status !== ParticipantStatus.READY)) {
      throw new BadRequestException('Tất cả thành viên cần vào phòng và bật camera trước khi chụp');
    }

    const sequence: CaptureSequence = {
      currentRound: 0,
      totalRounds: totalSlots / room.max_participants,
      totalSlots,
      complete: false,
      capturesByRound: new Map(),
      pendingByRound: new Map(),
      timer: null,
    };
    this.captureSequences.set(roomId, sequence);
    await this.startCaptureRound(room, sequence);

    return { status: 'countdown_started', totalRounds: sequence.totalRounds };
  }

  private async startCaptureRound(room: Room, sequence: CaptureSequence) {
    if (sequence.timer) clearTimeout(sequence.timer);
    await this.roomRepository.update(room.id, { status: RoomStatus.COUNTDOWN });
    const countdownEndsAt = Date.now() + GROUP_COUNTDOWN_SECONDS * 1000;
    this.eventEmitter.emit('room.countdown_started', {
      roomId: room.id,
      countdownSeconds: GROUP_COUNTDOWN_SECONDS,
      countdownEndsAt,
      roundIndex: sequence.currentRound,
      totalRounds: sequence.totalRounds,
    });

    sequence.timer = setTimeout(async () => {
      if (this.captureSequences.get(room.id) !== sequence) return;
      const triggerAt = Date.now() + 500;
      await this.roomRepository.update(room.id, { status: RoomStatus.CAPTURING });
      this.eventEmitter.emit('room.capture_trigger', {
        roomId: room.id,
        triggerAt,
        roundIndex: sequence.currentRound,
        totalRounds: sequence.totalRounds,
      });
    }, GROUP_COUNTDOWN_SECONDS * 1000);
  }

  private async startCaptureBreak(room: Room, sequence: CaptureSequence) {
    if (sequence.timer) clearTimeout(sequence.timer);
    await this.roomRepository.update(room.id, { status: RoomStatus.COUNTDOWN });
    const breakEndsAt = Date.now() + GROUP_ROUND_BREAK_SECONDS * 1000;
    this.eventEmitter.emit('room.break_started', {
      roomId: room.id,
      breakEndsAt,
      roundIndex: sequence.currentRound,
      totalRounds: sequence.totalRounds,
    });

    sequence.timer = setTimeout(async () => {
      if (this.captureSequences.get(room.id) !== sequence) return;
      await this.startCaptureRound(room, sequence);
    }, GROUP_ROUND_BREAK_SECONDS * 1000);
  }

  async submitCapture(roomId: string, accountId: string, roundIndex: number, file: Buffer) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');

    const sequence = this.captureSequences.get(roomId);
    if (!sequence) throw new BadRequestException('Phòng chưa bắt đầu lượt chụp');
    if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex >= sequence.totalRounds) {
      throw new BadRequestException('Lượt chụp không hợp lệ');
    }

    const participant = await this.participantRepository.findOne({
      where: { room_id: roomId, account_id: accountId },
      relations: { account: true },
    });
    if (!participant) throw new ForbiddenException('Bạn không ở trong phòng này');

    const captures = sequence.capturesByRound.get(roundIndex) ?? new Set<string>();
    sequence.capturesByRound.set(roundIndex, captures);
    if (captures.has(accountId)) return { success: true, duplicate: true };
    if (sequence.complete) throw new BadRequestException('Buổi chụp đã hoàn tất');
    if (roundIndex !== sequence.currentRound || room.status !== RoomStatus.CAPTURING) {
      throw new BadRequestException('Lượt chụp hiện tại chưa sẵn sàng');
    }
    const pending = sequence.pendingByRound.get(roundIndex) ?? new Set<string>();
    if (pending.has(accountId)) return { success: true, duplicate: true };

    const outputSlotIndex = roundIndex * room.max_participants + participant.slot_index;
    if (outputSlotIndex >= sequence.totalSlots) throw new BadRequestException('Slot ảnh không hợp lệ');

    const ttlSeconds = Math.max(600, Math.ceil((room.expires_at.getTime() - Date.now()) / 1000));
    pending.add(accountId);
    sequence.pendingByRound.set(roundIndex, pending);
    try {
      await this.captureStore.save(
        room.room_code,
        participant.account.username || 'anonymous',
        outputSlotIndex,
        file,
        ttlSeconds,
      );
    } catch (error) {
      pending.delete(accountId);
      throw error;
    }
    pending.delete(accountId);

    await this.participantRepository.update(participant.id, { status: ParticipantStatus.CAPTURED });
    captures.add(accountId);
    sequence.capturesByRound.set(roundIndex, captures);
    this.eventEmitter.emit('room.participant_captured', {
      roomId,
      slotIndex: outputSlotIndex,
      roundIndex,
      totalRounds: sequence.totalRounds,
    });

    if (captures.size >= room.max_participants) {
      if (sequence.currentRound + 1 < sequence.totalRounds) {
        sequence.currentRound += 1;
        await this.startCaptureBreak(room, sequence);
        return { success: true, nextRound: sequence.currentRound };
      }

      if (sequence.timer) clearTimeout(sequence.timer);
      sequence.complete = true;
      const participants = await this.participantRepository.find({
        where: { room_id: roomId },
        relations: { account: true },
        order: { slot_index: 'ASC' },
      });
      this.eventEmitter.emit('room.all_captured', {
        roomId,
        slots: Array.from({ length: sequence.totalSlots }, (_, slotIndex) => {
          const participant = participants.find((item) => item.slot_index === slotIndex % room.max_participants);
          return { slotIndex, username: participant?.account.username || 'anonymous' };
        }),
      });
    }
    return { success: true };
  }

  async getCaptureBuffer(roomId: string, accountId: string, slotIndex: number): Promise<Buffer> {
    const { room } = await this.assertCanEditRoom(roomId, accountId);

    const participant = await this.participantRepository.findOne({
      where: { room_id: roomId, slot_index: slotIndex % room.max_participants },
      relations: { account: true },
    });

    const buf = participant && (await this.captureStore.get(room.room_code, participant.account.username || 'anonymous', slotIndex));
    if (!buf) throw new GoneException('Ảnh raw đã hết hạn hoặc chưa có, cần chụp lại');

    return buf;
  }

  async createParticipantResult(roomId: string, accountId: string, original: Buffer, processed: Buffer) {
    const { room, policy } = await this.assertCanEditRoom(roomId, accountId);
    if (policy !== 'all_participants') throw new ForbiddenException('Chỉ chủ phòng được lưu ảnh đã chỉnh');
    const sequence = this.captureSequences.get(roomId);
    if (!sequence?.complete) throw new BadRequestException('Buổi chụp chưa hoàn tất');

    const existing = await this.sessionResultRepository.findOne({ where: { room_id: roomId, account_id: accountId } });
    if (existing) {
      const existingPhoto = await this.photoRepository.findOne({ where: { id: existing.photo_id } });
      if (existingPhoto?.processed_file_url) {
        await this.customersService.ensurePhotoSession(accountId, {
          sessionType: 'group',
          imageUrl: existingPhoto.processed_file_url,
        });
      }
      return existing;
    }

    const frameId = this.frameSelectionStore.get(roomId);
    if (!frameId) throw new BadRequestException('Phòng chưa chọn frame');
    const [originalUrl, processedUrl] = await Promise.all([
      this.storageService.uploadFile('photos/group', original, 'png'),
      this.storageService.uploadFile('photos/group', processed, 'png'),
    ]);
    const photo = await this.photoRepository.save({
      account_id: accountId,
      frame_id: frameId,
      media_type: MediaType.PHOTO,
      original_file_url: originalUrl,
      processed_file_url: processedUrl,
      status: PhotoStatus.COMPLETED,
      share_token: randomUUID(),
    });
    const sessionResult = await this.sessionResultRepository.save({
      account_id: accountId,
      session_type: SessionType.GROUP,
      room_id: roomId,
      photo_id: photo.id,
      status: SessionResultStatus.READY,
    });
    await this.customersService.ensurePhotoSession(accountId, {
      sessionType: 'group',
      imageUrl: processedUrl,
    });

    const resultCount = await this.sessionResultRepository.count({ where: { room_id: roomId, session_type: SessionType.GROUP } });
    if (resultCount >= room.max_participants) {
      await this.roomRepository.update(roomId, { status: RoomStatus.COMPLETED, completed_at: new Date() });
      this.frameSelectionStore.clear(roomId);
      const participants = await this.participantRepository.find({
        where: { room_id: roomId },
        relations: { account: true },
      });
      const captureKeys = (sequence.totalSlots ? Array.from({ length: sequence.totalSlots }) : []).map((_, slotIndex) => {
        const participant = participants.find((item) => item.slot_index === slotIndex % room.max_participants);
        return participant
          ? this.captureStore.key(room.room_code, participant.account.username || 'anonymous', slotIndex)
          : '';
      }).filter(Boolean);
      await this.captureStore.deleteMany(captureKeys);
      this.captureSequences.delete(roomId);
    }

    return sessionResult;
  }

  async finalizeRoomPhoto(roomId: string, accountId: string, original: Buffer, processed: Buffer, recordingId?: string, gifId?: string) {
    const { policy } = await this.assertCanEditRoom(roomId, accountId);
    if (policy === 'all_participants') {
      return this.createParticipantResult(roomId, accountId, original, processed);
    }
    await this.assertIsHost(roomId, accountId);

    const existing = await this.sessionResultRepository.findOne({ where: { room_id: roomId } });
    if (existing) {
      const photo = await this.photoRepository.findOne({ where: { id: existing.photo_id } });
      if (photo?.processed_file_url) {
        await this.customersService.ensurePhotoSession(existing.account_id, {
          sessionType: 'group',
          imageUrl: photo.processed_file_url,
        });
      }
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
    await this.customersService.ensurePhotoSession(room.host_account_id, {
      sessionType: 'group',
      imageUrl: processedUrl,
    });

    await this.roomRepository.update(roomId, {
      status: RoomStatus.POST_PRODUCTION,
      completed_at: new Date(),
    });
    this.frameSelectionStore.clear(roomId);
    const sequence = this.captureSequences.get(roomId);
    if (sequence?.timer) clearTimeout(sequence.timer);
    this.captureSequences.delete(roomId);

    const selectedFrame = await this.frameRepository.findOne({ where: { id: frameId } });
    const captureKeys = (selectedFrame?.layout_config.slots ?? []).map((_, slotIndex) => {
      const participant = participants.find((item) => item.slot_index === slotIndex % room.max_participants);
      return participant
        ? this.captureStore.key(room.room_code, participant.account.username || 'anonymous', slotIndex)
        : '';
    }).filter(Boolean);
    await this.captureStore.deleteMany(captureKeys);

    this.eventEmitter.emit('room.composed_ready', { roomId, photo, sessionResult });

    return { photo, sessionResult };
  }

  async getResult(roomId: string, accountId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Phòng không tồn tại');
    const policy = await this.captureStore.getEditPolicy(room.room_code);
    const resultOwnerId = policy === 'all_participants' ? accountId : room.host_account_id;
    const sessionResult = await this.sessionResultRepository.findOne({
      where: { room_id: roomId, account_id: resultOwnerId, session_type: SessionType.GROUP },
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
