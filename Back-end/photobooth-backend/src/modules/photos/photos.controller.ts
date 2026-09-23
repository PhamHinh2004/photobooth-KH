import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFiles,
  UseInterceptors,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { StorageService } from '../storage/storage.service';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { PhotoStatus } from './entities/photo.entity';

@ApiTags('Photos')
@Controller('photos')
export class PhotosController {
  constructor(
    private readonly storageService: StorageService,
    private readonly photosService: PhotosService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Lưu ảnh sau khi chụp + ghép frame (upload R2 + tạo record Photo)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', example: 'uuid-cua-account' },
        frameId: { type: 'string', example: 'uuid-cua-frame' },
        mediaType: { type: 'string', example: 'photo' },
        originalFile: { type: 'string', format: 'binary' },
        processedFile: { type: 'string', format: 'binary' },
      },
      required: ['accountId', 'mediaType', 'originalFile', 'processedFile'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'originalFile', maxCount: 1 },
      { name: 'processedFile', maxCount: 1 },
    ]),
  )
  async create(
    @Body() dto: CreatePhotoDto,
    @UploadedFiles()
    files: { originalFile?: Express.Multer.File[]; processedFile?: Express.Multer.File[] },
  ) {
    const originalFile = files.originalFile?.[0];
    const processedFile = files.processedFile?.[0];

    if (!originalFile || !processedFile) {
      throw new BadRequestException('Cần upload đủ cả originalFile và processedFile');
    }

    // 1. Upload cả 2 file lên R2, đặt theo thư mục riêng của account
    const originalUrl = await this.storageService.uploadFile(
      `photos/${dto.accountId}`,
      originalFile.buffer,
      this.extractExt(originalFile.originalname),
    );
    const processedUrl = await this.storageService.uploadFile(
      `photos/${dto.accountId}`,
      processedFile.buffer,
      this.extractExt(processedFile.originalname),
    );

    // 2. Tạo record Photo
    return this.photosService.create({
      account_id: dto.accountId,
      frame_id: dto.frameId ?? undefined,
      media_type: dto.mediaType,
      original_file_url: originalUrl,
      processed_file_url: processedUrl,
      thumbnail_url: processedUrl, // tạm dùng chung, có thể generate thumbnail riêng sau
      status: PhotoStatus.COMPLETED,
      file_size_bytes: processedFile.size,
      share_token: crypto.randomUUID(),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 ảnh (dùng khi khách quét QR)' })
  async findOne(@Param('id') id: string) {
    const photo = await this.photosService.findOne(id);
    if (!photo) throw new NotFoundException('Không tìm thấy ảnh');
    return photo;
  }

  @Get('share/:shareToken')
  @ApiOperation({ summary: 'Xem ảnh qua share_token (link từ QR code)' })
  async findByShareToken(@Param('shareToken') shareToken: string) {
    const photo = await this.photosService.findByShareToken(shareToken);
    if (!photo) throw new NotFoundException('Link đã hết hạn hoặc không tồn tại');
    await this.photosService.incrementDownloadCount(photo.id);
    return photo;
  }

  private extractExt(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()! : 'png';
  }
}
