import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AssignFramesDto, CreateTypeStyleDto, UpdateTypeStyleDto } from './dto/type-style.dto';
import { TypeStylesService } from './type-styles.service';

@ApiTags('Type Styles')
@Controller('type-styles')
export class TypeStylesController {
  constructor(private readonly typeStylesService: TypeStylesService) {}

  // ===== PUBLIC: chỉ đọc danh sách đang active (dùng để lọc frame) =====
  @Get()
  @ApiOperation({ summary: 'Danh sách type style đang active (public)' })
  findActive() {
    return this.typeStylesService.findAll(true);
  }

  // ===== ADMIN =====
  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Danh sách tất cả type style' })
  findAll() {
    return this.typeStylesService.findAll(false);
  }

  @Get('admin/stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Thống kê type style (kèm số frame, lượt dùng, rating)' })
  getStats() {
    return this.typeStylesService.getStats();
  }

  @Get('admin/unassigned-frames')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Frame chưa thuộc type style nào' })
  getUnassignedFrames() {
    return this.typeStylesService.getUnassignedFrames();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Chi tiết type style' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.typeStylesService.findOne(id);
  }

  @Get(':id/frames')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Chi tiết type style + danh sách frame + thống kê' })
  getDetailWithFrames(@Param('id', ParseUUIDPipe) id: string) {
    return this.typeStylesService.getDetailWithFrames(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Tạo type style' })
  create(@Body() dto: CreateTypeStyleDto) {
    return this.typeStylesService.create(dto);
  }

  @Post(':id/frames')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Gán frame vào type style' })
  assignFrames(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignFramesDto) {
    return this.typeStylesService.assignFrames(id, dto.frame_ids);
  }

  @Delete(':id/frames/:frameId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Gỡ frame khỏi type style' })
  unassignFrame(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('frameId', ParseUUIDPipe) frameId: string,
  ) {
    return this.typeStylesService.unassignFrame(id, frameId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Cập nhật type style' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTypeStyleDto) {
    return this.typeStylesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[Admin] Xóa type style' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.typeStylesService.remove(id);
  }
}
