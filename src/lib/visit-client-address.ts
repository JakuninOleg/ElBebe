import { isIP } from 'node:net';

/** Only opt in behind a proxy that overwrites X-Real-IP; Docker uses its exact configured address. */
export function visitClientAddress(remote: string, headers: Headers, trustProxy = process.env.EL_BEBE_TRUST_LOCAL_PROXY === 'true', proxyIps = (process.env.EL_BEBE_TRUSTED_PROXY_IPS ?? '').split(',').map(value => value.trim()).filter(value => isIP(value))): string {
  const address = remote.replace(/^::ffff:/, '');
  if (!trustProxy || !['127.0.0.1', '::1', ...proxyIps].includes(address)) return remote;
  const forwarded = headers.get('x-real-ip') ?? '';
  return isIP(forwarded) ? forwarded : remote;
}
