import { IsUUID } from 'class-validator';

export class CreateRecordingDto {
  @IsUUID()
  accountId: string;
}
