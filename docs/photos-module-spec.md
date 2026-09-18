# Spec — PhotosModule (Entity, API tạo Photo, Upload R2)

## Bối cảnh

Bảng `Photo` đã thiết kế sẵn (theo ERD): lưu kết quả sau khi khách chụp ảnh + ghép frame. Dùng lại `StorageService` (đã có, dùng chung `frames`) để upload file lên R2. Module này phụ thuộc `FramesModule` đã test xong ở bước trước (`frame_id` là FK).

---

## 1. Entity `Photo` (TypeORM) — khớp đúng ERD

```typescript
// photos/entities/photo.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Frame } from '../../frames/entities/frame.entity';

export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
}

export enum SessionType {
  SINGLE = 'single',
  GROUP = 'group',
}

export enum PhotoStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('photo')
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: string;

  @ManyToOne(() => Frame, { nullable: true })
  @JoinColumn({ name: 'frame_id' })
  frame: Frame;

  @Column({ nullable: true })
  frame_id: string;

  @Column({ type: 'enum', enum: MediaType })
  media_type: MediaType;

  @Column({ type: 'enum', enum: SessionType })
  session_type: SessionType;

  /** Mảng asset_id (icon/filter) đã áp dụng, lưu dạng jsonb */
  @Column({ type: 'jsonb', nullable: true })
  filters_applied: string[] | null;

  /** Ảnh gốc chưa ghép frame — giữ lại để cho phép đổi frame/re-edit sau này */
  @Column()
  original_file_url: string;

  /** Ảnh đã ghép frame hoàn chỉnh — null trong lúc đang xử lý (status = processing) */
  @Column({ nullable: true })
  processed_file_url: string | null;

  @Column({ nullable: true })
  thumbnail_url: string | null;

  @Column({ type: 'enum', enum: PhotoStatus, default: PhotoStatus.PROCESSING })
  status: PhotoStatus;

  /** Chỉ có giá trị khi media_type = video */
  @Column({ type: 'int', nullable: true })
  duration_seconds: number | null;

  @Column({ type: 'bigint', nullable: true })
  file_size_bytes: number | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  /** Dùng cho QR share link, unique + indexed */
  @Column({ unique: true })
  share_token: string;

  @Column({ default: 0 })
  download_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

---

## 2. DTO

```typescript
// photos/dto/create-photo.dto.ts
import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { MediaType, SessionType } from '../entities/photo.entity';

export class CreatePhotoDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  frameId?: string;

  @IsEnum(MediaType)
  mediaType: MediaType;

  @IsEnum(SessionType)
  sessionType: SessionType;
}
```

```typescript
// photos/dto/photo-response.dto.ts
// Dùng để định hình response trả về FE (ẩn field không cần thiết nếu có)
export class PhotoResponseDto {
  id: string;
  customer_id: string;
  frame_id: string | null;
  media_type: string;
  session_type: string;
  original_file_url: string;
  processed_file_url: string | null;
  thumbnail_url: string | null;
  status: string;
  share_token: string;
  created_at: Date;
}
```

---

## 3. Controller

Nhận 2 file (`originalFile`, `processedFile`) cùng lúc qua `multipart/form-data`, đúng luồng đã thiết kế ở spec chụp ảnh trước đó.

```typescript
// photos/photos.controller.ts
import {
  Controller, Post, Get, Param,
  UploadedFiles, UseInterceptors, Body, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';
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
        customerId: { type: 'string', example: 'uuid-cua-customer' },
        frameId: { type: 'string', example: 'uuid-cua-frame' },
        mediaType: { type: 'string', example: 'photo' },
        sessionType: { type: 'string', example: 'single' },
        originalFile: { type: 'string', format: 'binary' },
        processedFile: { type: 'string', format: 'binary' },
      },
      required: ['customerId', 'mediaType', 'sessionType', 'originalFile', 'processedFile'],
    },
  })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'originalFile', maxCount: 1 },
    { name: 'processedFile', maxCount: 1 },
  ]))
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

    // 1. Upload cả 2 file lên R2, đặt theo thư mục riêng của customer
    const originalUrl = await this.storageService.uploadFile(
      `photos/${dto.customerId}`,
      originalFile.buffer,
      this.extractExt(originalFile.originalname),
    );
    const processedUrl = await this.storageService.uploadFile(
      `photos/${dto.customerId}`,
      processedFile.buffer,
      this.extractExt(processedFile.originalname),
    );

    // 2. Tạo record Photo
    return this.photosService.create({
      customer_id: dto.customerId,
      frame_id: dto.frameId ?? null,
      media_type: dto.mediaType,
      session_type: dto.sessionType,
      original_file_url: originalUrl,
      processed_file_url: processedUrl,
      thumbnail_url: processedUrl, // tạm dùng chung, có thể generate thumbnail riêng sau
      status: PhotoStatus.COMPLETED,
      file_size_bytes: processedFile.size,
      share_token: uuid(),
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
```

---

## 4. Service

```typescript
// photos/photos.service.ts
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
      relations: ['frame'],
    });
  }

  findByShareToken(shareToken: string) {
    return this.photoRepository.findOne({
      where: { share_token: shareToken },
      relations: ['frame'],
    });
  }

  async incrementDownloadCount(id: string) {
    await this.photoRepository.increment({ id }, 'download_count', 1);
  }

  findByCustomer(customerId: string) {
    return this.photoRepository.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
      relations: ['frame'],
    });
  }
}
```

---

## 5. Module

```typescript
// photos/photos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { Photo } from './entities/photo.entity';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo]), StorageModule],
  controllers: [PhotosController],
  providers: [PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}
```

> Nhớ import `PhotosModule` vào `AppModule`.

---

## 6. Test bằng Swagger

Gọi `POST /photos` với body `multipart/form-data`:

```
customerId: <uuid customer có sẵn>
frameId: <uuid frame "Sweet Moments" đã tạo ở bước trước>
mediaType: photo
sessionType: single
originalFile: [chọn 1 file ảnh test — 4 ảnh ghép chưa có frame]
processedFile: [chọn 1 file ảnh test — đã ghép frame hoàn chỉnh]
```

Sau khi tạo xong, lấy `share_token` trong response, test tiếp:
```
GET /photos/share/{share_token}
```
→ kiểm tra `download_count` tăng lên 1 sau mỗi lần gọi.

---

## 7. Checklist

- [ ] `POST /photos` thiếu 1 trong 2 file → trả `400`
- [ ] `POST /photos` thành công → cả 2 file xuất hiện đúng trong R2 (`photos/<customerId>/...`)
- [ ] Record `Photo` lưu đúng `original_file_url` khác `processed_file_url`
- [ ] `share_token` tự sinh, unique, không trùng giữa các lần tạo
- [ ] `GET /photos/share/:shareToken` với token không tồn tại → `404`
- [ ] `GET /photos/share/:shareToken` hợp lệ → `download_count` tăng đúng mỗi lần gọi
- [ ] `frame_id` để trống (không chọn frame) → vẫn tạo được `Photo` thành công vì field này `nullable`

---

## Ghi chú

- `filters_applied`, `duration_seconds` **chưa dùng đến** ở bước chụp đơn frame 1x4 hiện tại — để `null`, sẽ dùng khi làm tính năng filter/quay video sau.
- `expires_at` hiện để `null` (không tự xóa) — nếu sau này muốn tự động dọn ảnh cũ để tiết kiệm storage, có thể set giá trị này khi tạo (vd `created_at + 30 ngày`) và viết thêm 1 cron job kiểm tra xóa định kỳ.
- `status = processing` chỉ thật sự cần thiết nếu sau này có xử lý bất đồng bộ (vd quay video cần thời gian encode). Với luồng chụp ảnh đơn hiện tại (xử lý xong ngay trên client trước khi upload), có thể set thẳng `completed` như code mẫu ở trên.
