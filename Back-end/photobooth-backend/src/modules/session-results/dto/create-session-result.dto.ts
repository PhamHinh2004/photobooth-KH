import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { SessionType } from '../entities/session-result.entity';

export class CreateSessionResultDto {
  @IsUUID()
  accountId: string;

  @IsEnum(SessionType)
  sessionType: SessionType;

  @IsOptional()
  @IsUUID()
  photoId?: string;

  @IsOptional()
  @IsUUID()
  recordingId?: string;

  @IsOptional()
  @IsUUID()
  gifId?: string;
}
