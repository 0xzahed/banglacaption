import { NextResponse } from "next/server";
import { saveCaptions } from "@/lib/store";
import { generateCaptions, type CaptionInput } from "@/lib/captions";

/** One-click demo captions for client demos. */
export async function POST() {
  const input: CaptionInput = {
    productName: "Jamdanai Sharee",
    price: 2850,
    oldPrice: 3500,
    category: "fashion",
    tone: "urgent",
    features: "Pure cotton, blouse piece included",
  };
  const { engine, captions } = await generateCaptions(input, 3);
  const saved = await saveCaptions(input, engine, captions);
  return NextResponse.json({ engine, captions: saved });
}
