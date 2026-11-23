import { ImageResponse } from "next/og";

type App = { name: string; url: string; emoji: string; icon: string };
type Shared = { s: { title: string; accent: string }; a: App[]; o?: 1 };

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

// your own main app icon, served from /public
async function hubIcon(req: Request) {
  try {
    const r = await fetch(new URL("/icon-512.png", req.url));
    if (!r.ok) return null;
    return `data:image/png;base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("s") || "";
  const data = decode(q);
  const accent = /^#[0-9a-f]{6}$/i.test(data?.s?.accent ?? "") ? data!.s.accent : "#1d1d1f";
  const solo = data?.o && data.a.length === 1 ? data.a[0] : null;

  // single-app link: that app's icon. whole-page link: your main icon.
  const src = solo ? (solo.emoji || !solo.icon ? null : await dataUri(solo.icon)) : await hubIcon(req);
  const fallback = solo ? solo.emoji || (solo.name || "?")[0].toUpperCase() : (data?.s?.title || "A")[0].toUpperCase();
  const size = 380;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle at 50% 45%, ${accent}55 0%, #f5f5f7 72%)`,
        }}
      >
        <div
          style={{
            width: size,
            height: size,
            borderRadius: size * 0.225,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: src ? "#ffffff" : "#ececf0",
            boxShadow: "0 40px 70px -24px rgba(0,0,0,0.38), 0 0 0 2px rgba(0,0,0,0.05)",
            fontSize: size * 0.48,
            color: "#6e6e73",
          }}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} width={size} height={size} alt="" />
          ) : (
            <span>{fallback}</span>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}