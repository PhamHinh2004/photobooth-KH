# Spec — Storage Module (Cloudflare R2)

## Bối cảnh

Project: **Photobooth backend** — NestJS + PostgreSQL (Neon) + Cloudflare R2 (lưu file ảnh/video).

Cần xây dựng 1 module `Storage` chịu trách nhiệm upload file lên Cloudflare R2 (S3-compatible), độc lập với logic nghiệp vụ của các module khác (`Photos`, `Frames`, `Assets`...). Các module khác chỉ gọi qua `StorageService`, không tự khởi tạo `S3Client` riêng.

---

## 1. Cài đặt package

```bash
npm install @aws-sdk/client-s3 uuid
npm install -D @types/uuid
```

---

## 2. Biến môi trường (`.env`)

```env
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=photobooth-kh-prod
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```

> Lưu ý: `R2_ENDPOINT` **không** kèm tên bucket ở cuối. Tên bucket truyền riêng qua field `Bucket` khi gọi lệnh S3.

---

## 3. Cấu trúc thư mục

```
src/
├── config/
│   └── s3.config.ts
├── storage/
│   ├── storage.module.ts
│   └── storage.service.ts
```

---

## 4. `src/config/s3.config.ts`

Chỉ khởi tạo `S3Client`, không chứa logic nghiệp vụ. Đăng ký như 1 provider để NestJS quản lý qua Dependency Injection.

```typescript
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export const S3_CLIENT = 'S3_CLIENT';

export const s3ClientProvider = {
  provide: S3_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new S3Client({
      endpoint: configService.get<string>('R2_ENDPOINT'),
      region: 'auto', // R2 luôn dùng 'auto'
      credentials: {
        accessKeyId: configService.get<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: configService.get<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  },
  inject: [ConfigService],
};
```

---

## 5. `src/storage/storage.service.ts`

Chứa toàn bộ logic upload/xóa file. Inject `S3Client` qua token `S3_CLIENT`.

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { S3_CLIENT } from '../config/s3.config';

@Injectable()
export class StorageService {
  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Upload file lên R2, trả về URL public để lưu vào DB (vd Photo.file_url)
   * @param folder Tên thư mục con trong bucket (vd customerId, "frames", "assets")
   * @param file Buffer nội dung file
   * @param ext Đuôi file, không kèm dấu chấm (vd "png", "mp4")
   */
  async uploadFile(folder: string, file: Buffer, ext: string): Promise<string> {
    const key = `${folder}/${uuid()}.${ext}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.get<string>('R2_BUCKET'),
        Key: key,
        Body: file,
        ContentType: this.resolveContentType(ext),
      }),
    );

    return `${this.configService.get<string>('R2_PUBLIC_URL')}/${key}`;
  }

  /**
   * Xóa file khỏi R2 theo URL public đã lưu trong DB
   */
  async deleteFile(fileUrl: string): Promise<void> {
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    const key = fileUrl.replace(`${publicUrl}/`, '');

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.configService.get<string>('R2_BUCKET'),
        Key: key,
      }),
    );
  }

  private resolveContentType(ext: string): string {
    const map: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      mp4: 'video/mp4',
    };
    return map[ext.toLowerCase()] ?? 'application/octet-stream';
  }
}
```

---

## 6. `src/storage/storage.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { s3ClientProvider } from '../config/s3.config';

@Module({
  providers: [StorageService, s3ClientProvider],
  exports: [StorageService], // để module khác (Photos, Frames, Assets) import và dùng
})
export class StorageModule {}
```

---

## 7. Cách dùng ở module khác (ví dụ `PhotosModule`)

**`photos.module.ts`** — import `StorageModule`

```typescript
import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';

@Module({
  imports: [StorageModule],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}
```

**`photos.service.ts`** — inject `StorageService`

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PhotosService {
  constructor(private readonly storageService: StorageService) {}

  async createPhoto(customerId: string, file: Buffer) {
    const fileUrl = await this.storageService.uploadFile(customerId, file, 'png');

    // TODO: lưu fileUrl vào bảng Photo qua Repository
    // return this.photoRepository.save({ customer_id: customerId, file_url: fileUrl });

    return { file_url: fileUrl };
  }
}
```

**`photos.controller.ts`** — endpoint nhận file upload

```typescript
import { Controller, Post, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotosService } from './photos.service';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post(':customerId/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('customerId') customerId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.photosService.createPhoto(customerId, file.buffer);
  }
}
```

---

## 8. Đăng ký `StorageModule` trong `app.module.ts`

Không bắt buộc import global — chỉ module nào cần dùng (`PhotosModule`, `FramesModule`, `AssetsModule`) mới import `StorageModule` riêng, giữ đúng nguyên tắc encapsulation của NestJS.

---

## 9. Checklist khi implement xong

- [ ] Test upload 1 ảnh qua Postman/Swagger, kiểm tra file xuất hiện đúng trong R2 bucket
- [ ] Kiểm tra URL trả về (`R2_PUBLIC_URL/...`) mở được trực tiếp trên trình duyệt (bucket đã bật Public Access)
- [ ] Test hàm `deleteFile()` xóa đúng file khi xóa 1 `Photo`/`Frame`/`Asset`
- [ ] Đảm bảo `.env` nằm trong `.gitignore`, không commit key thật lên Git
- [ ] Đặt tên file bằng UUID (đã có trong code), **không** dùng tên gốc từ client để tránh trùng/đoán được URL

---

## Ghi chú bảo mật

- R2 Access Key hiện dùng loại **Account API Token** với quyền **Admin Read & Write trên All buckets** — nên cân nhắc tạo lại token mới giới hạn quyền **Object Read & Write** và chỉ áp dụng cho đúng bucket `photobooth-kh-prod`, để giảm rủi ro nếu key bị lộ.
- Không hardcode key trong code, luôn đọc qua `ConfigService`/`.env`.
