import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { AllExceptionsFilter } from './exception/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DatabaseModule } from './database/database.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // Cấu hình env
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 giây
        limit: 100, // tối đa 100 request/60s
      },
    ]),

    // Database
    DatabaseModule,

    // Modules
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // Global JWT Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Throttler Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global Response Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
