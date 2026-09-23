import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gif } from './entities/gif.entity';

@Injectable()
export class GifsService {
  constructor(
    @InjectRepository(Gif)
    private readonly gifRepository: Repository<Gif>,
  ) {}

  async create(data: Partial<Gif>): Promise<Gif> {
    const gif = this.gifRepository.create(data);
    return this.gifRepository.save(gif);
  }

  async findOne(id: string): Promise<Gif> {
    const gif = await this.gifRepository.findOne({ where: { id } });
    if (!gif) {
      throw new NotFoundException(`Gif with ID ${id} not found`);
    }
    return gif;
  }

  async remove(id: string): Promise<void> {
    const gif = await this.findOne(id);
    await this.gifRepository.remove(gif);
  }
}
