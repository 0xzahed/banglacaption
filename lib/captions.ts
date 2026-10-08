export type Tone = "casual" | "formal" | "urgent";
export type Category = "fashion" | "food" | "beauty" | "electronics" | "other";

export interface CaptionInput {
  productName: string;
  price: number;
  oldPrice: number;
  category: Category;
  tone: Tone;
  features: string;
}

export const TONES: Tone[] = ["casual", "formal", "urgent"];
export const CATEGORIES: Category[] = ["fashion", "food", "beauty", "electronics", "other"];

const isTone = (s: string): s is Tone => (TONES as string[]).includes(s);
const isCategory = (s: string): s is Category => (CATEGORIES as string[]).includes(s);

export function normalizeInput(b: Record<string, unknown>): CaptionInput {
  const productName = String(b.productName ?? "").trim();
  if (!productName) throw new Error("Product name is required.");
  const price = Number(b.price ?? 0);
  const oldPrice = Number(b.oldPrice ?? 0);
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be 0 or more.");
  if (!Number.isFinite(oldPrice) || oldPrice < 0) throw new Error("Old price must be 0 or more.");
  const tone = String(b.tone ?? "casual");
  const category = String(b.category ?? "fashion");
  if (!isTone(tone)) throw new Error("Tone must be casual, formal or urgent.");
  if (!isCategory(category)) throw new Error("Invalid category.");
  return { productName, price, oldPrice, category, tone, features: String(b.features ?? "").trim() };
}

const bnDigit = (n: number) => `৳${n.toLocaleString("en-IN")}`;

const HASHTAGS: Record<Category, string[]> = {
  fashion: ["#OnlineShoppingBD", "#FashionBD", "#DhakaShopping", "#DeshiFashion", "#CashOnDelivery"],
  food: ["#FoodBD", "#DhakaFood", "#HomeDelivery", "#FreshFood", "#OrderNow"],
  beauty: ["#BeautyBD", "#SkincareBD", "#MakeupBD", "#GlowUp", "#CashOnDelivery"],
  electronics: ["#GadgetBD", "#TechBD", "#DhakaTech", "#WarrantyAvailable", "#CashOnDelivery"],
  other: ["#OnlineShoppingBD", "#DhakaShopping", "#CashOnDelivery", "#BestPriceBD", "#OrderNow"],
};

// Deterministic pick (stable per product) so demos are reproducible.
const pick = <T,>(arr: T[], seed: string, salt: number): T => {
  let h = salt;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
};

const OPENERS: Record<Tone, string[]> = {
  casual: ["নতুন কালেকশনে এসেছে", "অনেকেই চেয়েছিলেন, তাই নিয়ে এলাম", "স্টক শেষ হওয়ার আগেই দেখে নিন"],
  formal: ["সম্মানিত ক্রেতাদের জন্য নতুন সংযোজন", "আপনাদের আস্থার আরেকটি নাম", "যত্নে নির্বাচিত নতুন পণ্য"],
  urgent: ["🔥 স্টক সীমিত — আজই অর্ডার করুন", "⚡ অফার শেষ হওয়ার আগেই নিন", "🚨 মাত্র কয়েক পিস বাকি"],
};

const CTAS: Record<Tone, string[]> = {
  casual: ["ইনবক্স করুন 📩", "কমেন্টে Interested লিখুন 💬", "WhatsApp-এ মেসেজ দিন 📲"],
  formal: ["অর্ডার করতে ইনবক্স করুন", "বিস্তারিত জানতে মেসেজ করুন", "সারাদেশে ক্যাশ অন ডেলিভারি"],
  urgent: ["এখনই ইনবক্স করুন, দেরি করবেন না ⏰", "স্টক শেষ — আজই বুক করুন", "অফার মিস করবেন না ❌"],
};

/** Rule-based Bangla caption engine — works fully offline, no API key needed. */
export function generateTemplateCaption(input: CaptionInput, variant: number): string {
  const { productName, price, oldPrice, category, tone, features } = input;
  const opener = pick(OPENERS[tone], productName, variant);
  const cta = pick(CTAS[tone], productName, variant + 7);
  const lines = [`✨ ${productName} ✨`, "", `${opener} — ${productName}।`];
  if (features) lines.push(`✅ ${features}`);
  if (oldPrice > price && price > 0) {
    const off = Math.round(((oldPrice - price) / oldPrice) * 100);
    lines.push(`💰 অফার প্রাইস: ${bnDigit(price)} (আগে ${bnDigit(oldPrice)}, ${off}% ছাড়!)`);
  } else if (price > 0) {
    lines.push(`💰 দাম: মাত্র ${bnDigit(price)}`);
  }
  if (tone === "urgent") lines.push("📦 সারাদেশে হোম ডেলিভারি + ক্যাশ অন ডেলিভারি");
  else lines.push("📦 সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা");
  lines.push("", cta, "", HASHTAGS[category].join(" "));
  return lines.join("\n");
}

export interface CaptionProvider {
  name: string;
  generate(input: CaptionInput, variant: number): Promise<string>;
}

export const templateProvider: CaptionProvider = {
  name: "template",
  generate: async (input, variant) => generateTemplateCaption(input, variant),
};

/** Upgrade path: plug any LLM API here. Throws until OPENAI_API_KEY is set. */
export const openaiProvider: CaptionProvider = {
  name: "openai",
  generate: async () => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set — using the built-in template engine instead.");
    }
    throw new Error("OpenAI provider is a stub in this MVP — wire chat completions here.");
  },
};

export async function generateCaptions(input: CaptionInput, count = 3): Promise<{ engine: string; captions: string[] }> {
  const useOpenAI = !!process.env.OPENAI_API_KEY;
  if (useOpenAI) {
    try {
      const captions = await Promise.all([0, 1, 2].slice(0, count).map((v) => openaiProvider.generate(input, v)));
      return { engine: "openai", captions };
    } catch {
      /* fall through to template engine */
    }
  }
  return { engine: "template", captions: Array.from({ length: count }, (_, v) => generateTemplateCaption(input, v)) };
}
