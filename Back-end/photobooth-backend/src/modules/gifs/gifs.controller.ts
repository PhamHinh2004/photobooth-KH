import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { StorageService } from '../storage/storage.service';
import { GifsService } from './gifs.service';
import { CreateGifDto } from './dto/create-gif.dto';
import { GifType } from './entities/gif.entity';

@ApiTags('Gifs')
@Controller('gifs')
export class GifsController {
  constructor(
    private readonly storageService: StorageService,
    private readonly gifsService: GifsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Upload file GIF lên R2 và tạo record DB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', example: 'uuid-cua-account' },
        gifType: { type: 'string', example: 'standard' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['accountId', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() dto: CreateGifDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng upload file GIF');
    }

    const gifUrl = await this.storageService.uploadFile(
      `gifs/${dto.accountId}`,
      file.buffer,
      this.extractExt(file.originalname),
    );

    return this.gifsService.create({
      gif_type: dto.gifType || GifType.STANDARD,
      image_url: gifUrl,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 file GIF' })
  findOne(@Param('id') id: string) {
    return this.gifsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa record GIF' })
  remove(@Param('id') id: string) {
    return this.gifsService.remove(id);
  }

  private extractExt(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()! : 'gif';
  }
}
