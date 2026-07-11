import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as accessible without authentication (login, signup, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
