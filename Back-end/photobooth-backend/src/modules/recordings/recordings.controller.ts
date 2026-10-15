import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { StorageService } from '../storage/storage.service';
import { RecordingsService } from './recordings.service';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { RecordingStatus } from './entities/recording.entity';

@ApiTags('Recordings')
@Controller('recordings')
export class RecordingsController {
  constructor(
    private readonly storageService: StorageService,
    private readonly recordingsService: RecordingsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Upload file Recording lên R2 và tạo record DB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', example: 'uuid-cua-account' },
        file: { type: 'string', format: 'binary' },
        thumbnail: { type: 'string', format: 'binary' },
      },
      required: ['accountId', 'file'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  async create(
    @Body() dto: CreateRecordingDto,
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    const file = files.file?.[0];
    const thumbnail = files.thumbnail?.[0];

    if (!file) {
      throw new BadRequestException('Vui lòng upload file video recording');
    }

    const fileUrl = await this.storageService.uploadFile(
      `recordings/${dto.accountId}`,
      file.buffer,
      this.extractExt(file.originalname),
    );

    let thumbnailUrl: string | null = null;
    if (thumbnail) {
      thumbnailUrl = await this.storageService.uploadFile(
        `recordings/${dto.accountId}`,
        thumbnail.buffer,
        this.extractExt(thumbnail.originalname),
      );
    }

    return this.recordingsService.create({
      file_url: fileUrl,
      thumbnail_url: thumbnailUrl,
      file_size_bytes: file.size,
      status: RecordingStatus.READY,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 file Recording' })
  findOne(@Param('id') id: string) {
    return this.recordingsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa record Recording' })
  remove(@Param('id') id: string) {
    return this.recordingsService.remove(id);
  }

  private extractExt(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()! : 'mp4';
  }
}
