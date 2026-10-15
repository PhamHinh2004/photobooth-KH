import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionResult, SessionResultStatus } from './entities/session-result.entity';
import { CreateSessionResultDto } from './dto/create-session-result.dto';

@Injectable()
export class SessionResultsService {
  constructor(
    @InjectRepository(SessionResult)
    private readonly sessionResultRepository: Repository<SessionResult>,
  ) {}

  async create(dto: CreateSessionResultDto): Promise<SessionResult> {
    const sessionResult = this.sessionResultRepository.create({
      account_id: dto.accountId,
      session_type: dto.sessionType,
      photo_id: dto.photoId,
      recording_id: dto.recordingId,
      gif_id: dto.gifId,
      status: SessionResultStatus.READY,
    });
    return this.sessionResultRepository.save(sessionResult);
  }

  async findOne(id: string): Promise<SessionResult> {
    const sessionResult = await this.sessionResultRepository.findOne({
      where: { id },
      relations: { photo: true, recording: true, gif: true, account: true },
    });
    if (!sessionResult) {
      throw new NotFoundException(`SessionResult with ID ${id} not found`);
    }
    return sessionResult;
  }

  async findByAccount(accountId: string): Promise<SessionResult[]> {
    return this.sessionResultRepository.find({
      where: { account_id: accountId },
      relations: { photo: true, recording: true, gif: true },
      order: { created_at: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const sessionResult = await this.findOne(id);
    await this.sessionResultRepository.remove(sessionResult);
  }
}
