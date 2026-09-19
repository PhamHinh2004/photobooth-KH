# Spec — API Frame (Upload R2 + Lưu Database)

## Bối cảnh

Dựa trên `StorageService` đã có sẵn (`storage.service.ts`, dùng cho `StorageTestController`). API này kết hợp **upload ảnh frame lên R2** và **lưu metadata (kèm `layout_config`) vào bảng `Frame`** trong cùng 1 request — khác với `StorageTestController` chỉ test thuần upload/delete, không liên quan bảng nào.

---

## 1. Entity `Frame` (TypeORM)

```typescript
// frames/entities/frame.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

export enum SessionTypeSupported {
  SINGLE = 'single',
  GROUP = 'group',
  BOTH = 'both',
}

@Entity('frame')
export class Frame {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  image_url: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column({ nullable: true })
  aspect_ratio: string;

  @Column({ type: 'enum', enum: SessionTypeSupported, default: SessionTypeSupported.BOTH })
  session_type_supported: SessionTypeSupported;

  @Column({ type: 'jsonb' })
  layout_config: {
    canvas_width: number;
    canvas_height: number;
    slots: { x: number; y: number; width: number; height: number }[];
  };

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ default: 0 })
  usage_count: number;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'created_by' })
  created_by: Account;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

---

## 2. DTO

Gửi qua `multipart/form-data` (kèm file) nên các field khác đều ở dạng string — `layout_config` là JSON string, tự parse trong Controller.

```typescript
// frames/dto/create-frame.dto.ts
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { SessionTypeSupported } from '../entities/frame.entity';

export class CreateFrameDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  aspect_ratio?: string;

  @IsOptional()
  @IsEnum(SessionTypeSupported)
  session_type_supported?: SessionTypeSupported = SessionTypeSupported.BOTH;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  sort_order?: number = 0;

  // Gửi dạng JSON string, parse trong Controller
  @IsString()
  layout_config: string;
}
```

---

## 3. Controller

```typescript
// frames/frames.controller.ts
import {
  Controller, Post, Get, Delete, Param,
  UploadedFile, UseInterceptors, Body, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Auth } from '../common/decorators/auth.decorator'; // decorator gộp JwtAuthGuard + RolesGuard + Roles
import { Role } from '../common/enums/role.enum';
import { StorageService } from '../storage/storage.service';
import { FramesService } from './frames.service';
import { CreateFrameDto } from './dto/create-frame.dto';

@ApiTags('Frames')
@ApiBearerAuth()
@Controller('frames')
export class FramesController {
  constructor(
    private readonly storageService: StorageService,
    private readonly framesService: FramesService,
  ) {}

  @Post()
  @Auth(Role.Admin)
  @ApiOperation({ summary: 'Tạo frame mới (upload ảnh + lưu layout_config)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Sweet Moments' },
        aspect_ratio: { type: 'string', example: '1:4' },
        session_type_supported: { type: 'string', example: 'single' },
        sort_order: { type: 'number', example: 0 },
        layout_config: {
          type: 'string',
          example: '{"canvas_width":1024,"canvas_height":4128,"slots":[{"x":120,"y":506,"width":750,"height":784}]}',
        },
        file: { type: 'string', format: 'binary' },
      },
      required: ['name', 'layout_config', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateFrameDto,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file frame để upload');
    }

    let layoutConfig;
    try {
      layoutConfig = JSON.parse(dto.layout_config);
    } catch {
      throw new BadRequestException('layout_config không đúng định dạng JSON');
    }

    this.validateLayoutConfig(layoutConfig);

    // 1. Upload ảnh frame lên R2 (dùng lại StorageService đã có)
    const filenameParts = file.originalname.split('.');
    const ext = filenameParts.length > 1 ? filenameParts.pop()! : 'png';
    const imageUrl = await this.storageService.uploadFile('frames', file.buffer, ext);

    // 2. Lưu metadata vào database
    return this.framesService.create({
      name: dto.name,
      image_url: imageUrl,
      thumbnail_url: imageUrl,
      width: layoutConfig.canvas_width,
      height: layoutConfig.canvas_height,
      aspect_ratio: dto.aspect_ratio,
      session_type_supported: dto.session_type_supported,
      sort_order: dto.sort_order,
      layout_config: layoutConfig,
      created_by: user.id,
    });
  }

  private validateLayoutConfig(config: any) {
    if (!config.canvas_width || !config.canvas_height || !Array.isArray(config.slots)) {
      throw new BadRequestException(
        'layout_config phải có canvas_width, canvas_height và mảng slots',
      );
    }
    for (const slot of config.slots) {
      if (
        typeof slot.x !== 'number' || typeof slot.y !== 'number' ||
        typeof slot.width !== 'number' || typeof slot.height !== 'number'
      ) {
        throw new BadRequestException('Mỗi slot trong layout_config phải có x, y, width, height là số');
      }
    }
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách frame (public — dùng khi khách chọn frame)' })
  findAll() {
    return this.framesService.findAll();
  }

  @Delete(':id')
  @Auth(Role.Admin)
  @ApiOperation({ summary: 'Xóa frame (kèm xóa file trên R2)' })
  async remove(@Param('id') id: string) {
    const frame = await this.framesService.findOne(id);
    await this.storageService.deleteFile(frame.image_url);
    await this.framesService.remove(id);
    return { message: 'Xóa frame thành công' };
  }
}
```

---

## 4. Service

```typescript
// frames/frames.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Frame } from './entities/frame.entity';

@Injectable()
export class FramesService {
  constructor(
    @InjectRepository(Frame)
    private readonly frameRepository: Repository<Frame>,
  ) {}

  async create(data: Partial<Frame> & { created_by: string }) {
    const frame = this.frameRepository.create({
      ...data,
      created_by: { id: data.created_by } as any,
    });
    return this.frameRepository.save(frame);
  }

  findAll() {
    return this.frameRepository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });
  }

  async findOne(id: string) {
    const frame = await this.frameRepository.findOne({ where: { id } });
    if (!frame) throw new NotFoundException('Không tìm thấy frame');
    return frame;
  }

  remove(id: string) {
    return this.frameRepository.delete(id);
  }
}
```

---

## 5. Module

```typescript
// frames/frames.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { Frame } from './entities/frame.entity';
import { FramesController } from './frames.controller';
import { FramesService } from './frames.service';

@Module({
  imports: [TypeOrmModule.forFeature([Frame]), StorageModule],
  controllers: [FramesController],
  providers: [FramesService],
  exports: [FramesService],
})
export class FramesModule {}
```

> Nhớ import `FramesModule` vào `AppModule`.

---

## 6. Test bằng Swagger

Gọi `POST /frames` với body `multipart/form-data`:

```
name: Sweet Moments
aspect_ratio: 1:4
session_type_supported: single
layout_config: {"canvas_width":1024,"canvas_height":4128,"slots":[{"x":120,"y":506,"width":750,"height":784},{"x":104,"y":1305,"width":821,"height":789},{"x":176,"y":2153,"width":719,"height":772},{"x":125,"y":2942,"width":772,"height":783}]}
file: [chọn file sweet-moments-frame-transparent.png]
```

---

## 7. Checklist

- [ ] `POST /frames` không kèm token → phải trả `401`
- [ ] `POST /frames` với account không phải admin → phải trả `403`
- [ ] `layout_config` gửi sai JSON → phải trả `400`
- [ ] `layout_config` thiếu `slots` hoặc slot thiếu x/y/width/height → phải trả `400`
- [ ] Upload thành công → kiểm tra file xuất hiện đúng trong R2 bucket, thư mục `frames/`
- [ ] Kiểm tra record trong bảng `Frame` có `layout_config` lưu đúng định dạng jsonb
- [ ] `GET /frames` (không cần token) → trả về danh sách, không lộ field nhạy cảm
- [ ] `DELETE /frames/:id` → file trên R2 bị xóa theo, record trong DB cũng bị xóa

---

## So sánh với `StorageTestController` đã có

| | `StorageTestController` | `FramesController` |
|---|---|---|
| Mục đích | Test thuần upload/delete file lên R2 | Nghiệp vụ thật: upload + lưu metadata Frame vào DB |
| Guard | Không có | `@Auth(Role.Admin)` cho tạo/xóa |
| Liên kết DB | Không | Có (`Frame` entity, `layout_config`) |
| Validate | Chỉ check có file hay không | Check thêm cấu trúc `layout_config` |
