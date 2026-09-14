import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageTestController } from './storage.controller';
import { s3ClientProvider } from '../../config/s3.config';

@Module({
  controllers: [StorageTestController],
  providers: [StorageService, s3ClientProvider],
  exports: [StorageService],
})
export class StorageModule {}
