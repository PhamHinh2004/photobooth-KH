import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Frame } from './entities/frame.entity';
import { GetFramesQueryDto } from './dto/get-frames-query.dto';

@Injectable()
export class FramesService {
  constructor(
    @InjectRepository(Frame)
    private readonly frameRepository: Repository<Frame>,
  ) {}

  async create(data: Omit<Frame, 'id' | 'is_active' | 'usage_count' | 'created_at' | 'updated_at' | 'created_by' | 'rating' | 'rating_count'> & { created_by: string }) {
    const { created_by, ...rest } = data;
    const frame = this.frameRepository.create({
      ...rest,
      created_by: { id: created_by } as any,
    });
    return this.frameRepository.save(frame);
  }

  findAll(query: GetFramesQueryDto) {
    const qb = this.frameRepository.createQueryBuilder('frame')
      .where('frame.is_active = :isActive', { isActive: true });

    if (query.name) {
      qb.andWhere('frame.name ILIKE :name', { name: `%${query.name}%` });
    }
    if (query.sessionType) {
      qb.andWhere('frame.session_type_supported = :sessionType', { sessionType: query.sessionType });
    }
    if (query.minRating) {
      qb.andWhere('frame.rating >= :minRating', { minRating: query.minRating });
    }

    const sortBy = query.sortBy || 'sort_order';
    const sortOrder = (query.sortOrder || 'asc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`frame.${sortBy}`, sortOrder);

    return qb.getMany();
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
