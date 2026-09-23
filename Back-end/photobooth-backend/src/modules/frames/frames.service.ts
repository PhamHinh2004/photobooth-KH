import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Frame } from './entities/frame.entity';

@Injectable()
export class FramesService {
  constructor(
    @InjectRepository(Frame)
    private readonly frameRepository: Repository<Frame>,
  ) {}

  async create(data: Omit<Frame, 'id' | 'is_active' | 'usage_count' | 'created_at' | 'updated_at' | 'created_by'> & { created_by: string }) {
    const { created_by, ...rest } = data;
    const frame = this.frameRepository.create({
      ...rest,
      created_by: { id: created_by } as any,
    });
    return this.frameRepository.save(frame);
  }

  findAll(name?: string) {
    const where: any = { is_active: true };
    if (name) {
      where.name = ILike(`%${name}%`);
    }
    return this.frameRepository.find({
      where,
      order: { sort_order: 'ASC' },
    });
  }

  findByAspectRatio(aspectRatio: string, name?: string) {
    const where: any = { is_active: true, aspect_ratio: aspectRatio as any };
    if (name) {
      where.name = ILike(`%${name}%`);
    }
    return this.frameRepository.find({
      where,
      order: { sort_order: 'ASC' },
    });
  }

  async findOne(id: string) {
    const frame = await this.frameRepository.findOne({ where: { id } });
    if (!frame) throw new NotFoundException('Không tìm thấy frame');
    return frame;
  }

  remove(id: string) {
    return this.frameRepository.delete(id);
  }
}
