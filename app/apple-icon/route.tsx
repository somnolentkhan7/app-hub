import { ImageResponse } from "next/og";

type App = { name: string; emoji: string; icon: string };
type Shared = { s: { accent: string }; a: App[] };

const decode = (s: string): Shared | null => {
  try {
    return JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

async function dataUri(u: string) {
  try {
    const url = new URL(u);
    if (url.protocol !== "https:" || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/.test(url.hostname)) return null;
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 4000);
    const r = await fetch(url, { signal: c.signal }).finally(() => clearTimeout(t));
    const type = (r.headers.get("content-type") || "").split(";")[0];
    if (!r.ok || !/^image\/(png|jpeg)$/.test(type)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 1_000_000) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("s") || "";
  const px = Math.min(512, Math.max(96, Number(sp.get("size")) || 180));
  const data = decode(q);
  const app = data?.a?.[0];
  if (!app) return Response.redirect(new URL("/apple-touch-icon.png", req.url));

  const img = app.emoji || !app.icon ? null : await dataUri(app.icon);
  const accent = /^#[0-9a-f]{6}$/i.test(data?.s?.accent ?? "") ? data!.s.accent : "#1d1d1f";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: img ? "#ffffff" : accent,
          color: "#ffffff",
          fontSize: px * 0.55,
        }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} width={px} height={px} alt="" />
        ) : (
          <span>{app.emoji || (app.name || "?")[0].toUpperCase()}</span>
        )}
      </div>
    ),
    { width: px, height: px },
  );
}