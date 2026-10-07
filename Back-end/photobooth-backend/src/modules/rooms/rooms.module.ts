import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomGateway } from './room.gateway';
import { Room } from './entities/room.entity';
import { RoomParticipant } from './entities/room-participant.entity';
import { RoomFrameSelectionStore } from './room-frame-selection.store';
import { RoomCaptureStore } from './room-capture.store';
import { StorageModule } from '../storage/storage.module';
import { Photo } from '../photos/entities/photo.entity';
import { SessionResult } from '../session-results/entities/session-result.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomParticipant, Photo, SessionResult]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    StorageModule,
    RedisModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomGateway, RoomFrameSelectionStore, RoomCaptureStore],
  exports: [RoomsService],
})
export class RoomsModule {}
