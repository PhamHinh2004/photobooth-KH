import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Res,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomEditPolicy } from './room-capture.store';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(user.id, dto);
  }

  @Get('code/:code')
  getByCode(@Param('code') code: string) {
    return this.roomsService.getByCode(code);
  }

  @Patch(':id/frame')
  selectFrame(@Param('id') roomId: string, @Body('frameId') frameId: string) {
    return this.roomsService.selectFrame(roomId, frameId);
  }

  @Post(':id/join')
  join(@Param('id') roomId: string, @CurrentUser() user: { id: string }) {
    return this.roomsService.join(roomId, user.id);
  }

  @Post(':id/livekit-token')
  getLivekitToken(@Param('id') roomId: string, @CurrentUser() user: { id: string }) {
    return this.roomsService.getLivekitToken(roomId, user.id);
  }

  @Patch(':id/participants/me/ready')
  setReady(@Param('id') roomId: string, @CurrentUser() user: { id: string }) {
    return this.roomsService.setReady(roomId, user.id);
  }

  @Patch(':id/edit-policy')
  setEditPolicy(
    @Param('id') roomId: string,
    @CurrentUser() user: { id: string },
    @Body('policy') policy: RoomEditPolicy,
  ) {
    return this.roomsService.setEditPolicy(roomId, user.id, policy);
  }

  @Post(':id/start-countdown')
  async startCountdown(@Param('id') roomId: string, @CurrentUser() user: { id: string }) {
    await this.roomsService.assertIsHost(roomId, user.id);
    return this.roomsService.startCountdown(roomId);
  }

  @Post(':id/open-studio')
  openStudio(@Param('id') roomId: string, @CurrentUser() user: { id: string }) {
    return this.roomsService.openStudio(roomId, user.id);
  }

  @Post(':id/captures')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1024 * 1024 },
      fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'),
    }),
  )
  submitCapture(
    @Param('id') roomId: string,
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
    @Body('roundIndex', ParseIntPipe) roundIndex: number,
  ) {
    if (!file) throw new BadRequestException('File không hợp lệ');
    return this.roomsService.submitCapture(roomId, user.id, roundIndex, file.buffer);
  }

  @Get(':id/captures/:slotIndex')
  async getCapture(
    @Param('id') roomId: string,
    @Param('slotIndex', ParseIntPipe) slotIndex: number,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    const buf = await this.roomsService.getCaptureBuffer(roomId, user.id, slotIndex);
    res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' }).send(buf);
  }

  @Post(':id/compose')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'original', maxCount: 1 },
        { name: 'processed', maxCount: 1 },
      ],
      { limits: { fileSize: 50 * 1024 * 1024 } },
    ),
  )
  async compose(
    @Param('id') roomId: string,
    @CurrentUser() user: { id: string },
    @UploadedFiles() files: { original?: Express.Multer.File[]; processed?: Express.Multer.File[] },
    @Body('recordingId') recordingId?: string,
    @Body('gifId') gifId?: string,
  ) {
    if (!files?.original?.[0] || !files?.processed?.[0]) {
      throw new BadRequestException('Thiếu file original hoặc processed');
    }
    return this.roomsService.finalizeRoomPhoto(
      roomId,
      user.id,
      files.original[0].buffer,
      files.processed[0].buffer,
      recordingId,
      gifId,
    );
  }

  @Get(':id/result')
  getResult(@Param('id') roomId: string, @CurrentUser() user: { id: string }) {
    return this.roomsService.getResult(roomId, user.id);
  }
}
