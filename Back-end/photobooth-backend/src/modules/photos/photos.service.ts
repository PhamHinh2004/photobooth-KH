import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './entities/photo.entity';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  create(data: Partial<Photo>) {
    const photo = this.photoRepository.create(data);
    return this.photoRepository.save(photo);
  }

  findOne(id: string) {
    return this.photoRepository.findOne({
      where: { id },
      relations: { frame: true },
    });
  }

  findByShareToken(shareToken: string) {
    return this.photoRepository.findOne({
      where: { share_token: shareToken },
      relations: { frame: true },
    });
  }

  async incrementDownloadCount(id: string) {
    await this.photoRepository.increment({ id }, 'download_count', 1);
  }

  findByAccount(accountId: string) {
    return this.photoRepository.find({
      where: { account_id: accountId },
      order: { created_at: 'DESC' },
      relations: { frame: true },
    });
  }

  createFrameAsset(data: {
    fileUrl: string;
    fileName: string;
    fileSizeBytes?: number;
    category?: string;
    accountId?: string | null;
    width?: number | null;
    height?: number | null;
    metadata?: Record<string, any>;
  }) {
    const photo = this.photoRepository.create({
      photo_type: 'frame_asset',
      media_type: (data.fileName.endsWith('.gif') ? 'photo' : 'photo') as any,
      title: data.fileName,
      asset_category: data.category || 'character',
      original_file_url: data.fileUrl,
      processed_file_url: data.fileUrl,
      thumbnail_url: data.fileUrl,
      status: 'completed' as any,
      file_size_bytes: data.fileSizeBytes,
      width: data.width,
      height: data.height,
      account_id: data.accountId || null,
      share_token: crypto.randomUUID(),
      metadata: data.metadata || {},
    });
    return this.photoRepository.save(photo);
  }

  getFrameAssets(category?: string, search?: string) {
    const qb = this.photoRepository
      .createQueryBuilder('p')
      .where('p.photo_type = :type', { type: 'frame_asset' })
      .orderBy('p.created_at', 'DESC');

    if (category && category !== 'all') {
      qb.andWhere('p.asset_category = :category', { category });
    }

    if (search && search.trim()) {
      qb.andWhere('p.title ILIKE :search', { search: `%${search.trim()}%` });
    }

    return qb.getMany();
  }

  async updateFrameAsset(id: string, patch: { title?: string; asset_category?: string; metadata?: Record<string, any> }) {
    await this.photoRepository.update(id, patch);
    return this.photoRepository.findOne({ where: { id } });
  }

  async deleteFrameAsset(id: string) {
    const photo = await this.photoRepository.findOne({ where: { id } });
    if (photo) {
      await this.photoRepository.delete(id);
    }
    return { success: true };
  }
}
