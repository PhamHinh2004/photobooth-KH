export type RoomStatus = 'setup' | 'waiting' | 'countdown' | 'capturing' | 'post_production' | 'completed' | 'expired';
export type ParticipantStatus = 'joined' | 'ready' | 'captured' | 'left';

export interface LayoutSlot { x: number; y: number; width: number; height: number; }
export interface LayoutConfig { canvas_width: number; canvas_height: number; slots: LayoutSlot[]; }
export interface Frame { 
  id: string; 
  name: string; 
  image_url: string; 
  layout_config: LayoutConfig; 
  supported_group_sizes?: number[];
}

export interface Participant {
  id: string; 
  account_id: string; 
  is_host: boolean;
  status: ParticipantStatus; 
  slot_index: number;
  account: { username: string; avatar_url?: string };
}

export interface Room {
  id: string; 
  room_code: string; 
  host_account_id: string;
  max_participants: number; 
  countdown_seconds: number;
  status: RoomStatus; 
  expires_at: string; // ISO
  participants?: Participant[];
  frame_id?: string;
}

// Payload realtime (namespace /rooms)
export interface CaptureTrigger { roomId: string; triggerAt: number }
export interface AllCaptured { roomId: string; slots: { slotIndex: number; username: string }[] }
