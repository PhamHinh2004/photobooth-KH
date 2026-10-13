import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { TypeStylesModule } from '../type-styles/type-styles.module';
import { Frame } from './entities/frame.entity';
import { FramesController } from './frames.controller';
import { FramesService } from './frames.service';

@Module({
  imports: [TypeOrmModule.forFeature([Frame]), StorageModule, TypeStylesModule],
  controllers: [FramesController],
  providers: [FramesService],
  exports: [FramesService],
})
export class FramesModule {}
