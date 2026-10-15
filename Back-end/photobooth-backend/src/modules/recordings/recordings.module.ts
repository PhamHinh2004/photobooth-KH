import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { Recording } from './entities/recording.entity';
import { RecordingsController } from './recordings.controller';
import { RecordingsService } from './recordings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recording]), StorageModule],
  controllers: [RecordingsController],
  providers: [RecordingsService]
})
export class RecordingsModule {}
