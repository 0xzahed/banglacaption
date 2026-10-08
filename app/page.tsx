"use client";

import { useCallback, useEffect, useState } from "react";

interface Caption {
  id: string;
  productName: string;
  price: number;
  caption: string;
  engine: string;
  createdAt: string;
}

const CATEGORIES = ["fashion", "food", "beauty", "electronics", "other"];
const TONES = ["casual", "formal", "urgent"];

const input =
  "h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm outline-none placeholder:text-slate-600 focus:border-fuchsia-500";
const btn =
  "h-11 cursor-pointer rounded-xl bg-fuchsia-500 px-5 font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40";
const ghost =
  "h-9 cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-fuchsia-500 hover:text-white";

export default function Home() {
  const [history, setHistory] = useState<Caption[]>([]);
  const [latest, setLatest] = useState<Caption[]>([]);
  const [engine, setEngine] = useState("");
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ productName: "", price: "", oldPrice: "", category: "fashion", tone: "casual", features: "" });

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/captions");
      setHistory((await r.json()).captions ?? []);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/captions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price) || 0, oldPrice: Number(form.oldPrice) || 0 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setLatest(j.captions ?? []);
      setEngine(j.engine ?? "");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setError("Copy failed — select the text manually.");
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/captions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setLatest((l) => l.filter((c) => c.id !== id));
    load();
  };

  const seed = async () => {
    setError("");
    const r = await fetch("/api/seed", { method: "POST" });
    const j = await r.json();
    setLatest(j.captions ?? []);
    setEngine(j.engine ?? "");
    load();
  };

  const Card = ({ c, fresh }: { c: Caption; fresh?: boolean }) => (
    <div className={`rounded-2xl border p-4 ${fresh ? "border-fuchsia-500/50 bg-fuchsia-500/5" : "border-slate-800 bg-slate-900/60"}`}>
      <p className="whitespace-pre-line text-[15px] leading-relaxed">{c.caption}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[11px] text-slate-500">{c.productName} · {c.engine}</span>
        <span className="ml-auto flex gap-2">
          <button onClick={() => copy(c.id, c.caption)} className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:border-fuchsia-500">
            {copied === c.id ? "✓ Copied" : "Copy"}
          </button>
          <button onClick={() => remove(c.id)} className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500 hover:border-red-500 hover:text-red-300">Del</button>
        </span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-fuchsia-400">BanglaCaption</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Captions that sell.</h1>
          <p className="mt-2 text-slate-400">Product in → 3 Bangla sales captions out. ৳299/mo.</p>
        </div>
        <button onClick={seed} className={ghost}>Demo captions</button>
      </header>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <form onSubmit={generate} className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="Product name * (e.g. Jamdanai Sharee)" className={`${input} col-span-2`} />
        <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price ৳" inputMode="numeric" className={input} />
        <input value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} placeholder="Old price ৳ (discount)" inputMode="numeric" className={input} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${input} cursor-pointer`}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className={`${input} cursor-pointer`}>
          {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Features (e.g. Pure cotton, blouse piece)" className={`${input} col-span-2`} />
        <button type="submit" disabled={busy} className={`${btn} col-span-2`}>{busy ? "Writing…" : "✨ Generate 3 captions"}</button>
      </form>

      {latest.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Fresh captions ({engine})</h2>
          <div className="mt-3 space-y-3">
            {latest.map((c) => <Card key={c.id} c={c} fresh />)}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">History</h2>
          <div className="mt-3 space-y-3">
            {history.filter((h) => !latest.some((l) => l.id === h.id)).map((c) => <Card key={c.id} c={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
