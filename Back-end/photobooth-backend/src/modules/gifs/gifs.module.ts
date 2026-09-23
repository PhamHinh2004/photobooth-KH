import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { Gif } from './entities/gif.entity';
import { GifsController } from './gifs.controller';
import { GifsService } from './gifs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Gif]), StorageModule],
  controllers: [GifsController],
  providers: [GifsService]
})
export class GifsModule {}
