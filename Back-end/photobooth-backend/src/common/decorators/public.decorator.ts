import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator dùng để đánh dấu route là public (không cần JWT auth).
 *
 * @example
 * @Public()
 * @Get('login')
 * login() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
