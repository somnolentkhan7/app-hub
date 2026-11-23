export function GET(req: Request) {
  const s = new URL(req.url).searchParams.get("s");
  let name = "My Apps";
  let solo = false;
  if (s) {
    try {
      const d = JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
      solo = !!d.o && d.a?.length === 1;
      name = solo ? d.a[0].name : d.s?.title || name;
    } catch {}
  }
  return Response.json(
    {
      name,
      short_name: name.slice(0, 12),
      start_url: s ? `/?s=${s}${solo ? "&go=1" : ""}` : "/",
      scope: "/",
      display: solo ? "browser" : "standalone",
      background_color: "#f5f5f7",
      theme_color: "#f5f5f7",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json" } },
  );
}