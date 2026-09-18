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

  findByCustomer(customerId: string) {
    return this.photoRepository.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
      relations: { frame: true },
    });
  }
}
