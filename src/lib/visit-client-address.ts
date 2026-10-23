import { isIP } from 'node:net';

/** Only opt in behind a local reverse proxy that overwrites X-Real-IP. */
export function visitClientAddress(remote: string, headers: Headers, trustLocalProxy = process.env.EL_BEBE_TRUST_LOCAL_PROXY === 'true'): string {
  if (!trustLocalProxy || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote)) return remote;
  const forwarded = headers.get('x-real-ip') ?? '';
  return isIP(forwarded) ? forwarded : remote;
}
