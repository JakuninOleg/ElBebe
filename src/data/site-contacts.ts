import { normalizeRuPhone, formatRuPhone } from '../lib/ru-phone.ts';
import { resolveSiteAddress, siteLocation } from './site-location.ts';
import { legalOperator } from './legal-operator.ts';

// Verified defaults; published CMS values are resolved in one place.
export const siteContacts = {
  phone: '+7 (918) 203-38-88',
  source: 'https://2gis.ru/sochi/firm/70000001044912349',
};

export function resolveContacts(data?: Record<string, unknown>) {
  const text = (key: string, fallback = '') => typeof data?.[key] === 'string' ? data[key].trim() : fallback;
  const phoneDigits = normalizeRuPhone(text('phone', siteContacts.phone)) || normalizeRuPhone(siteContacts.phone)!;
  const messenger = (key: string, hosts: string[]): string | null => {
    try { const url = new URL(text(key)); return url.protocol === 'https:' && !url.username && !url.password && !url.port && hosts.includes(url.hostname) ? url.href : null; } catch { return null; }
  };
  const whatsapp = normalizeRuPhone(text('whatsapp_phone')) || phoneDigits;
  const email = text('email', legalOperator.email);
  return {
    phone: formatRuPhone(phoneDigits), phoneHref: `tel:+${phoneDigits}`,
    email: /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : legalOperator.email,
    address: resolveSiteAddress(data?.address),
    hours: text('hours', 'Работаем 24/7'),
    entry_hint: text('entry_hint', siteLocation.floor + '. Маршрут и расположение входа уточним перед визитом.'),
    whatsapp_phone: text('whatsapp_phone'), telegram_url: text('telegram_url'), vk_url: text('vk_url'),
    messengers: [
      { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${whatsapp}` },
      { id: 'telegram', label: 'Telegram', href: messenger('telegram_url', ['t.me', 'telegram.me']) },
      { id: 'vk', label: 'VK', href: messenger('vk_url', ['vk.com', 'www.vk.com', 'vk.ru', 'www.vk.ru']) },
    ],
  };
}
export type SiteContacts = ReturnType<typeof resolveContacts>;
