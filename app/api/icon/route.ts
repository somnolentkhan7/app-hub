import { NextRequest, NextResponse } from "next/server";

const attr = (tag: string, n: string) => tag.match(new RegExp(n + "\\s*=\\s*[\"']([^\"']*)[\"']", "i"))?.[1];
const meta = (html: string, n: string) => {
  for (const t of html.match(/<meta\b[^>]*>/gi) || []) {
    if ((attr(t, "property") || attr(t, "name") || "").toLowerCase() === n) return attr(t, "content");
  }
};

async function get(u: string) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 5000);
  try {
    return await fetch(u, { signal: c.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; AppIconFetcher)" } });
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req: NextRequest) {
  let base: URL;
  try { base = new URL(req.nextUrl.searchParams.get("url") || ""); } catch { return NextResponse.json({}, { status: 400 }); }
  if (!/^https?:$/.test(base.protocol) || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/.test(base.hostname)) return NextResponse.json({}, { status: 400 });
  try {
    const r = await get(base.href);
    const html = (await r.text()).slice(0, 300000);
    base = new URL(r.url);
    const abs = (h?: string, b: URL = base) => { try { return h ? new URL(h, b).href : undefined; } catch { return undefined; } };
    const cands: { u: string; s: number }[] = [];
    let manifest: string | undefined;
    for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
      const rel = (attr(tag, "rel") || "").toLowerCase();
      const href = abs(attr(tag, "href"));
      if (!href) continue;
      const size = parseInt(attr(tag, "sizes") || "0") || 0;
      if (rel.includes("apple-touch-icon")) cands.push({ u: href, s: 1000 + size });
      else if (rel.split(/\s+/).includes("icon") || rel.includes("shortcut")) cands.push({ u: href, s: size - (href.split("?")[0].endsWith(".svg") ? 50 : 0) });
      else if (rel === "manifest") manifest = href;
    }
    if (manifest) {
      try {
        const m = await (await get(manifest)).json();
        for (const i of m.icons || []) {
          const u = abs(i.src, new URL(manifest));
          if (u) cands.push({ u, s: 500 + (parseInt(i.sizes) || 0) });
        }
      } catch {}
    }
    cands.push({ u: new URL("/favicon.ico", base).href, s: -100 });
    cands.sort((a, b) => b.s - a.s);
    const title = (meta(html, "og:title") || html.match(/<title[^>]*>([^<]*)/i)?.[1] || "").trim();
    const description = (meta(html, "og:description") || meta(html, "description") || "").trim();
    return NextResponse.json({ icon: cands[0].u, title, description });
  } catch {
    return NextResponse.json({});
  }
}