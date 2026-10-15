import { Room as LkRoom, RoomEvent } from 'livekit-client';
import { roomsApi } from '../api/rooms.api';

export async function joinLivekit(roomId: string) {
  const { token, url } = await roomsApi.livekitToken(roomId);
  const lk = new LkRoom({ adaptiveStream: true, dynacast: true });
  await lk.connect(url, token);
  
  // Enable camera and microphone
  await lk.localParticipant.enableCameraAndMicrophone();
  
  return lk;
}
