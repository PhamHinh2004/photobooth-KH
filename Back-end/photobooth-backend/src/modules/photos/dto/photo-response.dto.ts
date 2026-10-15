export class PhotoResponseDto {
  id: string;
  customer_id: string;
  frame_id: string | null;
  media_type: string;
  session_type: string;
  original_file_url: string;
  processed_file_url: string | null;
  thumbnail_url: string | null;
  status: string;
  share_token: string;
  created_at: Date;
}
