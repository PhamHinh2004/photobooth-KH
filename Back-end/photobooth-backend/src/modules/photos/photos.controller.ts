import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Query,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
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

  @Post('frame-asset')
  @ApiOperation({ summary: 'Upload và lưu ảnh asset trang trí frame vào entity Photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFrameAsset(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name?: string,
    @Body('category') category?: string,
    @Body('accountId') accountId?: string,
    @Body('width') width?: string,
    @Body('height') height?: string,
    @Body('metadata') metadataStr?: string,
  ) {
    if (!file) throw new BadRequestException('Vui lòng chọn file tải lên');
    const ext = this.extractExt(file.originalname);
    const fileUrl = await this.storageService.uploadFile('frame-assets', file.buffer, ext);

    let parsedMeta: Record<string, any> = {};
    if (metadataStr) {
      try {
        parsedMeta = JSON.parse(metadataStr);
      } catch {}
    }

    const photo = await this.photosService.createFrameAsset({
      fileUrl,
      fileName: name || file.originalname.replace(/\.[^/.]+$/, ''),
      fileSizeBytes: file.size,
      category: category || 'character',
      accountId: accountId || null,
      width: width ? parseInt(width, 10) : null,
      height: height ? parseInt(height, 10) : null,
      metadata: parsedMeta,
    });

    return photo;
  }

  @Get('frame-assets')
  @ApiOperation({ summary: 'Lấy danh sách ảnh asset trang trí frame từ entity Photo' })
  async getFrameAssets(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.photosService.getFrameAssets(category, search);
  }

  @Patch('frame-assets/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin asset (tên, danh mục)' })
  async updateFrameAsset(
    @Param('id') id: string,
    @Body() dto: { title?: string; asset_category?: string; metadata?: Record<string, any> },
  ) {
    return this.photosService.updateFrameAsset(id, dto);
  }

  @Delete('frame-assets/:id')
  @ApiOperation({ summary: 'Xóa asset khỏi entity Photo' })
  async deleteFrameAsset(@Param('id') id: string) {
    return this.photosService.deleteFrameAsset(id);
  }

  @Get('proxy-image')
  @ApiOperation({ summary: 'Proxy ảnh để đảm bảo CORS an toàn cho Canvas export' })
  async proxyImage(@Query('url') imageUrl: string, @Res() res: Response) {
    if (!imageUrl) {
      throw new BadRequestException('Vui lòng cung cấp url ảnh');
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const arrayBuf = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    } catch (err: any) {
      return res.status(400).send(`Proxy error: ${err.message}`);
    }
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
