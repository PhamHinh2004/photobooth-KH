import {
  Controller,
  Post,
  Delete,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StorageService } from './storage.service';

@ApiTags('Storage Test')
@Controller('storage-test')
export class StorageTestController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload file lên Cloudflare R2 để test' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        folder: { type: 'string', example: 'test-folder' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder = 'test-folder',
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload');
    }

    const filenameParts = file.originalname.split('.');
    const ext = filenameParts.length > 1 ? filenameParts.pop()! : 'bin';

    const fileUrl = await this.storageService.uploadFile(folder, file.buffer, ext);

    return {
      message: 'Upload file lên Cloudflare R2 thành công!',
      fileUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Xóa file khỏi Cloudflare R2 theo URL' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileUrl: {
          type: 'string',
          example:
            'https://pub-4eb303709ef24609a3b420990203812a.r2.dev/test-folder/example.png',
        },
      },
      required: ['fileUrl'],
    },
  })
  async deleteFile(@Body('fileUrl') fileUrl: string) {
    if (!fileUrl) {
      throw new BadRequestException('fileUrl là bắt buộc');
    }

    await this.storageService.deleteFile(fileUrl);

    return {
      message: 'Xóa file thành công!',
      deletedUrl: fileUrl,
    };
  }
}
