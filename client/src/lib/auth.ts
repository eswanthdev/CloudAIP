import { AuthTokens } from '@/types';

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function setTokens(tokens: AuthTokens): void {
  accessToken = tokens.accessToken;
  if (typeof document !== 'undefined') {
    document.cookie = `refreshToken=${tokens.refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;
  }
}

export function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )refreshToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearTokens(): void {
  accessToken = null;
  if (typeof document !== 'undefined') {
    document.cookie = 'refreshToken=; path=/; max-age=0';
  }
}

export function hasRefreshToken(): boolean {
  return !!getRefreshToken();
}
