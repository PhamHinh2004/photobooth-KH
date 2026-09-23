import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionResult } from './entities/session-result.entity';
import { SessionResultsController } from './session-results.controller';
import { SessionResultsService } from './session-results.service';

@Module({
  imports: [TypeOrmModule.forFeature([SessionResult])],
  controllers: [SessionResultsController],
  providers: [SessionResultsService]
})
export class SessionResultsModule {}
