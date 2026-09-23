import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recording } from './entities/recording.entity';

@Injectable()
export class RecordingsService {
  constructor(
    @InjectRepository(Recording)
    private readonly recordingRepository: Repository<Recording>,
  ) {}

  async create(data: Partial<Recording>): Promise<Recording> {
    const recording = this.recordingRepository.create(data);
    return this.recordingRepository.save(recording);
  }

  async findOne(id: string): Promise<Recording> {
    const recording = await this.recordingRepository.findOne({ where: { id } });
    if (!recording) {
      throw new NotFoundException(`Recording with ID ${id} not found`);
    }
    return recording;
  }

  async remove(id: string): Promise<void> {
    const recording = await this.findOne(id);
    await this.recordingRepository.remove(recording);
  }
}
