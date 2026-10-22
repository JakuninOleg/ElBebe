export const MAP_CHOICE_KEY = 'elbebi-map-choice-v1';
export const MAP_CHOICE_LIFETIME = 180 * 24 * 60 * 60 * 1000;
export type MapChoice = { version: 1; maps: boolean; savedAt: number };

export function parseMapChoice(raw: string | null, now = Date.now()): MapChoice | null {
  if (!raw) return null;
  try {
    const choice: unknown = JSON.parse(raw);
    if (!choice || typeof choice !== 'object') return null;
    const value = choice as Record<string, unknown>;
    if (value.version !== 1 || typeof value.maps !== 'boolean' || typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt)) return null;
    if (value.savedAt > now || now - value.savedAt >= MAP_CHOICE_LIFETIME) return null;
    return { version: 1, maps: value.maps, savedAt: value.savedAt };
  } catch { return null; }
}
