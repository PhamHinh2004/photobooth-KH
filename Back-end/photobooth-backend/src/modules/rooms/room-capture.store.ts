import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

export type RoomEditPolicy = 'host_only' | 'all_participants';

@Injectable()
export class RoomCaptureStore {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  /** room:{roomCode}:{username}:{slotIndex} */
  key(roomCode: string, username: string, slotIndex: number) {
    return `room:${roomCode}:${encodeURIComponent(username)}:${slotIndex}`;
  }

  private editPolicyKey(roomCode: string) {
    return `room:${roomCode}:edit-policy`;
  }

  async getEditPolicy(roomCode: string): Promise<RoomEditPolicy> {
    const value = await this.redis.get(this.editPolicyKey(roomCode));
    return value === 'host_only' ? 'host_only' : 'all_participants';
  }

  setEditPolicy(roomCode: string, policy: RoomEditPolicy, ttlSeconds: number) {
    return this.redis.set(this.editPolicyKey(roomCode), policy, 'EX', ttlSeconds);
  }

  save(roomCode: string, username: string, slotIndex: number, buf: Buffer, ttlSeconds: number) {
    return this.redis.set(this.key(roomCode, username, slotIndex), buf, 'EX', ttlSeconds);
  }

  get(roomCode: string, username: string, slotIndex: number): Promise<Buffer | null> {
    return this.redis.getBuffer(this.key(roomCode, username, slotIndex));
  }

  async deleteMany(keys: string[]) {
    if (keys.length) await this.redis.del(...keys);
  }
}
