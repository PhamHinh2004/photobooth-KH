import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StorageService } from '../storage/storage.service';
import { CreateFrameDto } from './dto/create-frame.dto';
import { SessionTypeSupported } from './entities/frame.entity';
import { FramesService } from './frames.service';

@ApiTags('Frames')
@ApiBearerAuth()
@Controller('frames')
export class FramesController {
  constructor(
    private readonly storageService: StorageService,
    private readonly framesService: FramesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
          example:
            '{"canvas_width":1024,"canvas_height":4128,"slots":[{"x":120,"y":506,"width":750,"height":784}]}',
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
      session_type_supported: dto.session_type_supported ?? SessionTypeSupported.BOTH,
      sort_order: dto.sort_order ?? 0,
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
        typeof slot.x !== 'number' ||
        typeof slot.y !== 'number' ||
        typeof slot.width !== 'number' ||
        typeof slot.height !== 'number'
      ) {
        throw new BadRequestException(
          'Mỗi slot trong layout_config phải có x, y, width, height là số',
        );
      }
    }
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách frame (public — dùng khi khách chọn frame)' })
  findAll(@Query('name') name?: string) {
    return this.framesService.findAll(name);
  }

  @Get('aspect-ratio/:aspectRatio')
  @ApiOperation({ summary: 'Danh sách frame theo aspect ratio' })
  findByAspectRatio(
    @Param('aspectRatio') aspectRatio: string,
    @Query('name') name?: string,
  ) {
    return this.framesService.findByAspectRatio(aspectRatio, name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa frame (kèm xóa file trên R2)' })
  async remove(@Param('id') id: string) {
    const frame = await this.framesService.findOne(id);
    await this.storageService.deleteFile(frame.image_url);
    await this.framesService.remove(id);
    return { message: 'Xóa frame thành công' };
  }
}
