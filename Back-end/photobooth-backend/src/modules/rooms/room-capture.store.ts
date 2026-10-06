import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RoomCaptureStore {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  /** room:{roomCode}:{username}:{slotIndex} */
  key(roomCode: string, username: string, slotIndex: number) {
    return `room:${roomCode}:${encodeURIComponent(username)}:${slotIndex}`;
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
