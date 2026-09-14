import { Injectable, Inject, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { S3_CLIENT } from '../../config/s3.config';

@Injectable()
export class StorageService {
  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Upload file lên Cloudflare R2, trả về public URL
   * @param folder Thư mục phân loại (vd: "photos", "frames", "assets", customerId)
   * @param file Buffer nội dung file
   * @param ext Phần mở rộng file (không bao gồm dấu dot, vd: "png", "jpg", "mp4")
   */
  async uploadFile(folder: string, file: Buffer, ext: string): Promise<string> {
    if (!file || file.length === 0) {
      throw new BadRequestException('File buffer cannot be empty');
    }

    const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
    const key = `${folder}/${randomUUID()}.${cleanExt}`;
    const bucket =
      this.configService.get<string>('r2.bucket') ||
      this.configService.get<string>('R2_BUCKET');
    const publicUrl =
      this.configService.get<string>('r2.publicUrl') ||
      this.configService.get<string>('R2_PUBLIC_URL');

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file,
          ContentType: this.resolveContentType(cleanExt),
        }),
      );

      const formattedPublicUrl = publicUrl?.endsWith('/')
        ? publicUrl.slice(0, -1)
        : publicUrl;

      return `${formattedPublicUrl}/${key}`;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file to Cloudflare R2: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Xóa file khỏi R2 dựa trên public URL đã lưu
   * @param fileUrl URL công khai của file
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    const bucket =
      this.configService.get<string>('r2.bucket') ||
      this.configService.get<string>('R2_BUCKET');
    const publicUrl =
      this.configService.get<string>('r2.publicUrl') ||
      this.configService.get<string>('R2_PUBLIC_URL');

    const formattedPublicUrl = publicUrl?.endsWith('/')
      ? publicUrl.slice(0, -1)
      : publicUrl;

    const key = formattedPublicUrl
      ? fileUrl.replace(`${formattedPublicUrl}/`, '')
      : fileUrl;

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete file from Cloudflare R2: ${(error as Error).message}`,
      );
    }
  }

  private resolveContentType(ext: string): string {
    const map: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      mp4: 'video/mp4',
      webm: 'video/webm',
      pdf: 'application/pdf',
    };
    return map[ext.toLowerCase()] ?? 'application/octet-stream';
  }
}
