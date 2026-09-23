import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';
import r2Config from './config/r2.config';
import { DatabaseModule } from './database/database.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { FramesModule } from './modules/frames/frames.module';
import { PhotosModule } from './modules/photos/photos.module';

import { StorageModule } from './modules/storage/storage.module';
import { GifsModule } from './modules/gifs/gifs.module';
import { RecordingsModule } from './modules/recordings/recordings.module';
import { SessionResultsModule } from './modules/session-results/session-results.module';
@Module({
  imports: [
    // Cấu hình env
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, mailConfig, r2Config],
      envFilePath: '.env',
    }),

    // Database
    DatabaseModule,

    // Modules
    AuthModule,
    AccountsModule,
    CustomersModule,
    FramesModule,
    PhotosModule,

    StorageModule,
    GifsModule,
    RecordingsModule,
    SessionResultsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
