import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomFrameSelectionStore {
  private selections = new Map<string, string>(); // roomId -> frameId

  set(roomId: string, frameId: string) {
    this.selections.set(roomId, frameId);
  }

  get(roomId: string): string | undefined {
    return this.selections.get(roomId);
  }

  clear(roomId: string) {
    this.selections.delete(roomId);
  }
}
