import type { APIRoute } from "astro";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, open } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, relative, resolve } from "node:path";

export const prerender = false;
const BODY_LIMIT = 8_192;
const WINDOW_MS = 10 * 60 * 1_000;
const rateLimits = new Map<string, number[]>();
let writeQueue: Promise<void> = Promise.resolve();

class RequestError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers,
  } });
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length")) > BODY_LIMIT) throw new RequestError(413, "Форма слишком большая.");
  const type = request.headers.get("content-type") ?? "";
  if (!/^(application\/json|application\/x-www-form-urlencoded|multipart\/form-data)(;|$)/i.test(type)) {
    throw new RequestError(415, "Неподдерживаемый формат формы.");
  }
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > BODY_LIMIT) { await reader.cancel(); throw new RequestError(413, "Форма слишком большая."); }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
  }
  const bytes = Buffer.concat(chunks);
  try {
    if (/^application\/json/i.test(type)) {
      const data: unknown = JSON.parse(bytes.toString("utf8"));
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
      return data as Record<string, unknown>;
    }
    const form = await new Response(bytes, { headers: { "Content-Type": type } }).formData();
    const data: Record<string, unknown> = {};
    for (const [key, value] of form) {
      if (key in data || typeof value !== "string") throw new Error();
      data[key] = value;
    }
    return data;
  } catch { throw new RequestError(400, "Не удалось прочитать форму. Заполните её ещё раз."); }
}

const value = (data: Record<string, unknown>, field: string) => typeof data[field] === "string" ? data[field].trim() : "";
function normalizedPhone(phone: string): string | null {
  if (!/^[+\d\s()\-]+$/.test(phone) || phone.length > 64) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  if (digits.length === 10) digits = `7${digits}`;
  else if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return `+${digits}`;
}
const key = (kind: string, source: string) => `${kind}:${createHash("sha256").update(source).digest("hex")}`;
function reserveRateLimit(ip: string, phone: string): number {
  const now = Date.now();
  for (const [id, attempts] of rateLimits) {
    const recent = attempts.filter((timestamp) => timestamp > now - WINDOW_MS);
    if (recent.length) rateLimits.set(id, recent); else rateLimits.delete(id);
  }
  const limits = [{ id: key("ip", ip), limit: 5 }, { id: key("phone", phone), limit: 3 }];
  let retryAfter = 0;
  for (const { id, limit } of limits) {
    const attempts = rateLimits.get(id) ?? [];
    if (attempts.length >= limit) retryAfter = Math.max(retryAfter, Math.ceil((attempts[0] + WINDOW_MS - now) / 1_000));
  }
  if (retryAfter) return retryAfter;
  if (rateLimits.size > 10_000) return 60;
  for (const { id } of limits) rateLimits.set(id, [...(rateLimits.get(id) ?? []), now]);
  return 0;
}

async function saveRequest(record: Record<string, unknown>): Promise<void> {
  // Vite can serve files under the project root. Store contact data outside that root,
  // including in development. The optional override supports a private volume and isolated checks.
  const file = process.env.EL_BEBE_VISITS_FILE
    ? resolve(process.env.EL_BEBE_VISITS_FILE) : resolve(homedir(), ".el-bebe", "visit-requests.jsonl");
  const fromProject = relative(process.cwd(), file);
  if (!fromProject || (!isAbsolute(fromProject) && fromProject !== ".." && !fromProject.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`))) {
    throw new Error("Visit request storage must be outside the project root.");
  }
  const write = writeQueue.then(async () => {
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    const handle = await open(file, "a", 0o600);
    try { await handle.writeFile(`${JSON.stringify(record)}\n`, "utf8"); await handle.sync(); }
    finally { await handle.close(); }
  });
  writeQueue = write.catch(() => {});
  await write;
}

export const POST: APIRoute = async (context) => {
  const { request, url } = context;
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return json(403, { ok: false, message: "Отправьте форму с сайта садика." });
  try {
    const data = await readBody(request);
    if (value(data, "website")) return json(400, { ok: false, message: "Не удалось отправить форму." });
    const name = value(data, "name").replace(/\s+/g, " ");
    const phone = normalizedPhone(value(data, "phone"));
    const consent = data.consent === true || ["on", "true", "1"].includes(value(data, "consent"));
    const errors: Record<string, string> = {};
    if (name.length < 2 || name.length > 80 || !/^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u.test(name)) errors.name = "Укажите имя: от 2 до 80 символов.";
    if (!phone) errors.phone = "Проверьте номер телефона.";
    if (!consent) errors.consent = "Подтвердите согласие на обработку данных для связи.";
    if (Object.keys(errors).length) return json(422, { ok: false, message: "Проверьте поля формы.", errors });
    let ip = "local";
    try { ip = context.clientAddress || ip; } catch { /* Some local adapters omit clientAddress. */ }
    // Client-supplied proxy headers cannot bypass the local rate limiter.
    const retryAfter = reserveRateLimit(ip, phone!);
    if (retryAfter) return json(429, { ok: false, message: "Слишком много обращений. Попробуйте позже." }, { "Retry-After": String(retryAfter) });
    const id = randomUUID();
    await saveRequest({ id, received_at: new Date().toISOString(), name, phone, consent: true, source: "/api/visit" });
    return json(201, { ok: true, message: "Заявка сохранена. Спасибо за обращение!", id });
  } catch (error) {
    if (error instanceof RequestError) return json(error.status, { ok: false, message: error.message });
    console.error("[El Bebe] Visit request could not be saved.");
    return json(500, { ok: false, message: "Не удалось сохранить заявку. Попробуйте отправить её позже." });
  }
};
export const ALL: APIRoute = () => json(405, { ok: false, message: "Используйте отправку формы." }, { Allow: "POST" });
