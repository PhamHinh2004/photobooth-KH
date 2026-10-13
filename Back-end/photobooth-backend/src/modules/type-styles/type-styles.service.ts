import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { TypeStyle } from './entities/type-style.entity';
import { Frame } from '../frames/entities/frame.entity';
import { CreateTypeStyleDto, UpdateTypeStyleDto } from './dto/type-style.dto';

@Injectable()
export class TypeStylesService {
  constructor(
    @InjectRepository(TypeStyle)
    private readonly typeStyleRepository: Repository<TypeStyle>,
    @InjectRepository(Frame)
    private readonly frameRepository: Repository<Frame>,
  ) {}

  async create(dto: CreateTypeStyleDto) {
    await this.ensureNameUnique(dto.name);
    return this.typeStyleRepository.save(this.typeStyleRepository.create(dto));
  }

  findAll(onlyActive = false) {
    return this.typeStyleRepository.find({
      where: onlyActive ? { is_active: true } : {},
      order: { sort_order: 'ASC', created_at: 'ASC' },
    });
  }

  async findOne(id: string) {
    const typeStyle = await this.typeStyleRepository.findOne({ where: { id } });
    if (!typeStyle) throw new NotFoundException('Không tìm thấy type style');
    return typeStyle;
  }

  async update(id: string, dto: UpdateTypeStyleDto) {
    const typeStyle = await this.findOne(id);
    if (dto.name && dto.name !== typeStyle.name) {
      await this.ensureNameUnique(dto.name);
    }
    Object.assign(typeStyle, dto);
    return this.typeStyleRepository.save(typeStyle);
  }

  async remove(id: string) {
    await this.findOne(id);
    // Frame liên quan sẽ được set type_style = NULL (onDelete: 'SET NULL')
    await this.typeStyleRepository.delete(id);
    return { message: 'Xóa type style thành công' };
  }

  // ===== THỐNG KÊ =====

  /** Danh sách type style kèm số liệu thống kê + tổng quan */
  async getStats() {
    const rows = await this.typeStyleRepository
      .createQueryBuilder('ts')
      .leftJoin('ts.frames', 'f')
      .select([
        'ts.id AS id',
        'ts.name AS name',
        'ts.description AS description',
        'ts.is_active AS is_active',
        'ts.sort_order AS sort_order',
        'ts.created_at AS created_at',
        'ts.updated_at AS updated_at',
      ])
      .addSelect('COUNT(f.id)', 'frame_count')
      .addSelect('COUNT(f.id) FILTER (WHERE f.is_active = true)', 'active_frame_count')
      .addSelect('COALESCE(SUM(f.usage_count), 0)', 'total_usage')
      .addSelect('COALESCE(AVG(NULLIF(f.rating, 0)), 0)', 'avg_rating')
      .groupBy('ts.id')
      .orderBy('ts.sort_order', 'ASC')
      .addOrderBy('ts.created_at', 'ASC')
      .getRawMany();

    const items = rows.map((r) => ({
      ...r,
      frame_count: Number(r.frame_count),
      active_frame_count: Number(r.active_frame_count),
      total_usage: Number(r.total_usage),
      avg_rating: Math.round(Number(r.avg_rating) * 10) / 10,
    }));

    const [totalFrames, unassignedFrames] = await Promise.all([
      this.frameRepository.count(),
      this.frameRepository.count({ where: { type_style_id: IsNull() } }),
    ]);

    return {
      overview: {
        total_styles: items.length,
        active_styles: items.filter((i) => i.is_active).length,
        total_frames: totalFrames,
        assigned_frames: totalFrames - unassignedFrames,
        unassigned_frames: unassignedFrames,
        total_usage: items.reduce((s, i) => s + i.total_usage, 0),
      },
      items,
    };
  }

  /** Chi tiết type style + danh sách frame + thống kê */
  async getDetailWithFrames(id: string) {
    const typeStyle = await this.findOne(id);
    const frames = await this.frameRepository.find({
      where: { type_style_id: id },
      order: { usage_count: 'DESC', created_at: 'DESC' },
    });

    const rated = frames.filter((f) => f.rating > 0);
    const bySessionType: Record<string, number> = {};
    const byAspectRatio: Record<string, number> = {};
    for (const f of frames) {
      bySessionType[f.session_type_supported] = (bySessionType[f.session_type_supported] || 0) + 1;
      const ar = f.aspect_ratio || 'unknown';
      byAspectRatio[ar] = (byAspectRatio[ar] || 0) + 1;
    }

    return {
      ...typeStyle,
      stats: {
        frame_count: frames.length,
        active_frame_count: frames.filter((f) => f.is_active).length,
        total_usage: frames.reduce((s, f) => s + (f.usage_count || 0), 0),
        avg_rating: rated.length
          ? Math.round((rated.reduce((s, f) => s + f.rating, 0) / rated.length) * 10) / 10
          : 0,
        total_rating_count: frames.reduce((s, f) => s + (f.rating_count || 0), 0),
        by_session_type: bySessionType,
        by_aspect_ratio: byAspectRatio,
        top_frame: frames[0] ?? null,
      },
      frames,
    };
  }

  /** Frame chưa thuộc type style nào (để gán) */
  getUnassignedFrames() {
    return this.frameRepository.find({
      where: { type_style_id: IsNull() },
      order: { created_at: 'DESC' },
    });
  }

  async assignFrames(id: string, frameIds: string[]) {
    await this.findOne(id);
    if (frameIds.length) {
      await this.frameRepository.update({ id: In(frameIds) }, { type_style_id: id });
    }
    return { message: `Đã gán ${frameIds.length} frame vào type style` };
  }

  async unassignFrame(id: string, frameId: string) {
    await this.frameRepository.update({ id: frameId, type_style_id: id }, { type_style_id: null });
    return { message: 'Đã gỡ frame khỏi type style' };
  }

  private async ensureNameUnique(name: string) {
    const existed = await this.typeStyleRepository.findOne({ where: { name } });
    if (existed) throw new ConflictException('Tên type style đã tồn tại');
  }
}
