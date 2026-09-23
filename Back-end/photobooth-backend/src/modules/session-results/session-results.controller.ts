import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { SessionResultsService } from './session-results.service';
import { CreateSessionResultDto } from './dto/create-session-result.dto';

@ApiTags('Session Results')
@Controller('session-results')
export class SessionResultsController {
  constructor(private readonly sessionResultsService: SessionResultsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo SessionResult tổng hợp (lưu photo, recording, gif)' })
  create(@Body() dto: CreateSessionResultDto) {
    return this.sessionResultsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 SessionResult kèm các file liên quan' })
  findOne(@Param('id') id: string) {
    return this.sessionResultsService.findOne(id);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Lấy danh sách các lượt chụp của 1 account' })
  findByAccount(@Param('accountId') accountId: string) {
    return this.sessionResultsService.findByAccount(accountId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa SessionResult' })
  remove(@Param('id') id: string) {
    return this.sessionResultsService.remove(id);
  }
}
