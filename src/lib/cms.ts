import { getEmDashCollection } from "emdash";
import type { ImageValue } from "emdash";
import { siteLocation, resolveSiteAddress } from '../data/site-location';

export interface SiteContent {
  settings: { hero_title: string; hero_text: string; address: string; phone: string; license_text: string };
  team: Array<{ id: string; name: string; role: string; bio: string; image: ImageValue | null }>;
  groups: Array<{ id: string; title: string; summary: string; activities: string; approach: string; image: ImageValue | null }>;
  rates: Array<{ id: string; title: string; hours: string; price: string; description: string; isMain: boolean; isEntryFee: boolean }>;
  faqs: Array<{ id: string; question: string; answer: string }>;
  spaces: Array<{ id: string; title: string; description: string; image: ImageValue | null }>;
  testimonials: Array<{ id: string; quote: string; author: string; source_url: string }>;
}

type CmsData = Record<string, unknown>;
type CmsEntry = { id: string; data: CmsData };
const defaults: SiteContent["settings"] = {
  hero_title: "Здесь детство идёт своим ходом",
  hero_text: "Играем, дружим и открываем мир. С заботой о каждом ребёнке.",
  address: siteLocation.address,
  phone: "",
  license_text: "Есть образовательная лицензия. Возможна оплата материнским капиталом.",
};
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

function safeUrl(value: unknown, allowLocal = false): string {
  const source = text(value);
  if (allowLocal && /^\/(?!\/)/.test(source) && !source.includes("\\")) return source;
  try { return ["https:", "http:"].includes(new URL(source).protocol) ? source : ""; }
  catch { return ""; }
}

function imageValue(value: unknown): ImageValue | null {
  // Native media values may carry a storageKey/id without a src. Let the
  // EmDash Image component resolve that reference through the storage adapter.
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  // These generated samples now use the curated real-photo fallback.
  if (/(?:^|\/)(?:el-bebe-)?(?:room|play|life|garden|playground|group-younger|group-middle-art|group-older-robot)\.webp$/.test(text(record.filename) || text(record.src))) return null;
  const src = safeUrl(record.src, true);
  if (!text(record.id) && !src) return null;
  return { ...record, id: text(record.id), src: src || undefined } as ImageValue;
}

async function collection(slug: string): Promise<CmsEntry[]> {
  const entries: CmsEntry[] = [];
  let cursor: string | undefined;
  try {
    do {
      const result = await getEmDashCollection<string, CmsData>(slug, {
        status: "published", limit: 100, cursor, orderBy: { created_at: "asc" },
      });
      if (result.error) throw result.error;
      entries.push(...result.entries);
      cursor = result.nextCursor;
    } while (cursor);
  } catch {
    // Missing collections on a fresh installation are safe to render as empty.
    // Never put content or contact details in logs.
    console.warn(`[El Bebe] Could not read collection ${slug}.`);
    return [];
  }
  return entries.sort((a, b) => {
    const orderA = typeof a.data.sort_order === "number" ? a.data.sort_order : 0;
    const orderB = typeof b.data.sort_order === "number" ? b.data.sort_order : 0;
    return orderA - orderB || a.id.localeCompare(b.id);
  });
}
const entryId = (entry: CmsEntry) => text(entry.data.id) || entry.id;

/** Read the actual published EmDash records on the server. */
export async function getSiteContent(): Promise<SiteContent> {
  const [site, team, rates, faqs, spaces, testimonials, groups] = await Promise.all([
    collection("el_bebe_site"), collection("el_bebe_team"), collection("el_bebe_rates"),
    collection("el_bebe_faqs"), collection("el_bebe_spaces"), collection("el_bebe_testimonials"),
    collection("el_bebe_groups"),
  ]);
  const settings = (site.find((entry) => entry.id === "main") ?? site[0])?.data;
  return {
    settings: {
      hero_title: text(settings?.hero_title) || defaults.hero_title,
      hero_text: text(settings?.hero_text) || defaults.hero_text,
      address: resolveSiteAddress(settings?.address),
      phone: text(settings?.phone),
      license_text: settings ? text(settings.license_text) : defaults.license_text,
    },
    team: team.filter((e) => text(e.data.title)).map((e) => ({
      id: entryId(e), name: text(e.data.title), role: text(e.data.role), bio: text(e.data.bio), image: imageValue(e.data.image),
    })),
    groups: groups.filter(e => text(e.data.title)).map(e => ({
      id: entryId(e), title: text(e.data.title), summary: text(e.data.summary), activities: text(e.data.activities), approach: text(e.data.approach), image: imageValue(e.data.image),
    })),
    rates: rates.filter((e) => text(e.data.title)).map((e) => ({
      id: entryId(e), title: text(e.data.title), hours: text(e.data.hours), price: text(e.data.price), description: text(e.data.description),
      isMain: e.data.is_main === true, isEntryFee: e.data.is_entry_fee === true,
    })),
    faqs: faqs.filter((e) => text(e.data.title) && text(e.data.answer)).map((e) => ({
      id: entryId(e), question: text(e.data.title), answer: text(e.data.answer),
    })),
    spaces: spaces.filter((e) => text(e.data.title)).map((e) => ({
      id: entryId(e), title: text(e.data.title), description: text(e.data.description), image: imageValue(e.data.image),
    })),
    testimonials: testimonials.filter((e) => text(e.data.title) && text(e.data.quote) && safeUrl(e.data.source_url)).map((e) => ({
      id: entryId(e), quote: text(e.data.quote), author: text(e.data.title), source_url: safeUrl(e.data.source_url),
    })),
  };
}
