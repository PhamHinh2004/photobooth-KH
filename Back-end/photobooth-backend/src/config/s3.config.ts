import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export const S3_CLIENT = 'S3_CLIENT';

export const s3ClientProvider = {
  provide: S3_CLIENT,
  useFactory: (configService: ConfigService) => {
    const endpoint =
      configService.get<string>('r2.endpoint') ||
      configService.get<string>('R2_ENDPOINT');
    const accessKeyId =
      configService.get<string>('r2.accessKeyId') ||
      configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey =
      configService.get<string>('r2.secretAccessKey') ||
      configService.get<string>('R2_SECRET_ACCESS_KEY');

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing Cloudflare R2 configuration in environment variables');
    }

    return new S3Client({
      endpoint,
      region: 'auto',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  },
  inject: [ConfigService],
};