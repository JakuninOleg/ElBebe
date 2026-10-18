// Confirmed 17.10.2026 in the kindergarten's 2GIS listing.
export const siteLocation = {
  address: 'Сочи, ул. Виноградная, 2/3',
  floor: '1 этаж',
  source: 'https://2gis.ru/sochi/firm/70000001044912349',
};

/** Upgrade the original incomplete seed value while preserving editor changes. */
export function resolveSiteAddress(value: unknown): string {
  const address = typeof value === 'string' ? value.trim() : '';
  return !address || address === 'Сочи, Виноградная улица' ? siteLocation.address : address;
}
