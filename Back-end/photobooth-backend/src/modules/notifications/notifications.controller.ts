import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Lấy danh sách thông báo của tôi (phân trang)' })
  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationsService.findByRecipient(user.id, query.page, query.limit);
  }

  @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc' })
  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.countUnread(user.id);
  }

  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo là đã đọc' })
  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @ApiOperation({ summary: 'Đánh dấu 1 thông báo là đã đọc' })
  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @ApiOperation({ summary: 'Xóa 1 thông báo' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.remove(id, user.id);
  }

  @ApiOperation({ summary: 'Admin gửi thông báo hệ thống' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/broadcast')
  broadcast(
    @CurrentUser() user: { id: string },
    @Body() dto: BroadcastNotificationDto,
  ) {
    return this.notificationsService.broadcast(dto, user.id);
  }
}
