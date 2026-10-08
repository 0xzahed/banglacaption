import { NextResponse } from "next/server";
import { deleteCaption, listCaptions, saveCaptions } from "@/lib/store";
import { generateCaptions, normalizeInput } from "@/lib/captions";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ captions: await listCaptions() });
}

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { productName, price?, oldPrice?, category?, tone?, features? }." }, { status: 400 });
  }
  try {
    const input = normalizeInput(b);
    const count = Math.min(5, Math.max(1, Number(b.count ?? 3) || 3));
    const { engine, captions } = await generateCaptions(input, count);
    const saved = await saveCaptions(input, engine, captions);
    return NextResponse.json({ engine, captions: saved }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  return NextResponse.json({ deleted: await deleteCaption(id) });
}
