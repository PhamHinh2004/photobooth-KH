import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, Patch, Delete, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PostsService } from './posts.service';
import { PostStatus } from './entities/post.entity';

@ApiTags('Admin / Reviews & Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/reviews')
export class AdminPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Lấy chỉ số bài viết' })
  getMetrics() {
    return this.postsService.getMetrics();
  }

  @Get('export')
  @ApiOperation({ summary: 'Xuất danh sách bài viết ra CSV' })
  async exportCsv(@Query() query: any, @Res() res: Response) {
    const csvStr = await this.postsService.exportCsv(query);
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="reviews.csv"');
    return res.send(csvStr);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài viết & đánh giá' })
  findAll(@Query() query: any) {
    return this.postsService.findAllForAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết bài viết' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Đổi trạng thái bài viết' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PostStatus,
  ) {
    return this.postsService.updateStatus(id, status);
  }

  @Patch(':id/pin')
  @ApiOperation({ summary: 'Ghim bài đánh giá' })
  updatePin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('is_pinned') isPinned: boolean,
  ) {
    return this.postsService.updatePin(id, isPinned);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài đánh giá' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.removeForAdmin(id);
  }
}
