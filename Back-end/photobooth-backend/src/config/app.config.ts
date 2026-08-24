import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  appName: process.env.APP_NAME ?? 'Photobooth API',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
}));
