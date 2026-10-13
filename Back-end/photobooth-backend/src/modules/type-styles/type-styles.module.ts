import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeStyle } from './entities/type-style.entity';
import { Frame } from '../frames/entities/frame.entity';
import { TypeStylesController } from './type-styles.controller';
import { TypeStylesService } from './type-styles.service';

@Module({
  imports: [TypeOrmModule.forFeature([TypeStyle, Frame])],
  controllers: [TypeStylesController],
  providers: [TypeStylesService],
  exports: [TypeStylesService],
})
export class TypeStylesModule { }
