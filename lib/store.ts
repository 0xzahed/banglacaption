import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { Caption } from "@/models/Caption";
import type { CaptionInput } from "@/lib/captions";

export interface CaptionDoc {
  id: string;
  productName: string;
  price: number;
  oldPrice: number;
  category: string;
  tone: string;
  caption: string;
  engine: string;
  createdAt: string;
}

type Raw = Record<string, unknown> & { _id?: unknown; createdAt?: Date | string };

// ---------- Shared file store ----------
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "captions.json");

function readFile(): CaptionDoc[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as CaptionDoc[];
  } catch {
    return [];
  }
}

function writeFile(all: CaptionDoc[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(all));
}

const toDoc = (r: Raw): CaptionDoc => ({
  id: String(r._id ?? r.id ?? ""),
  productName: String(r.productName ?? ""),
  price: Number(r.price ?? 0),
  oldPrice: Number(r.oldPrice ?? 0),
  category: String(r.category ?? ""),
  tone: String(r.tone ?? ""),
  caption: String(r.caption ?? ""),
  engine: String(r.engine ?? "template"),
  createdAt: String(r.createdAt ?? new Date().toISOString()),
});

export async function listCaptions(): Promise<CaptionDoc[]> {
  if (await db()) {
    const rows = (await Caption.find({}).sort({ _id: -1 }).limit(50).lean().catch(() => [])) as unknown as Raw[];
    return rows.map(toDoc);
  }
  return [...readFile()].reverse().slice(0, 50);
}

export async function saveCaptions(input: CaptionInput, engine: string, captions: string[]): Promise<CaptionDoc[]> {
  const docs: CaptionDoc[] = captions.map((caption) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productName: input.productName,
    price: input.price,
    oldPrice: input.oldPrice,
    category: input.category,
    tone: input.tone,
    caption,
    engine,
    createdAt: new Date().toISOString(),
  }));
  if (await db()) {
    await Caption.insertMany(docs.map(({ id: _id, ...rest }) => rest)).catch(() => undefined);
    return docs;
  }
  const all = readFile();
  all.push(...docs);
  writeFile(all);
  return docs;
}

export async function deleteCaption(id: string): Promise<boolean> {
  if (await db()) {
    const r = await Caption.findByIdAndDelete(id).catch(() => null);
    return !!r;
  }
  const all = readFile();
  const n = all.length;
  const kept = all.filter((c) => c.id !== id);
  if (kept.length !== n) writeFile(kept);
  return kept.length !== n;
}
