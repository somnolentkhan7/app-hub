"use client";
import { useEffect, useState } from "react";

type AppItem = { id: string; name: string; desc: string; url: string; emoji: string; icon: string };
type Settings = { owner: string; title: string; intro: string; accent: string };
type Shared = { s: Settings; a: Omit<AppItem, "id">[]; o?: 1 }; // o = single-app link

const KEY = "myapps.v1";
const ACCENTS = ["#1d1d1f", "#0071e3", "#2f7d5b", "#b4532a", "#8e44ad", "#d6336c"];
const DEFAULTS: Settings = {
  owner: "",
  title: "A few apps I made",
  intro: "I built these myself and thought you'd like them. Open any of them, or add this page to your home screen to keep them close.",
  accent: ACCENTS[0],
};

const uid = () => Math.random().toString(36).slice(2, 9);
const encode = (d: Shared) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(d)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decode = (s: string): Shared | null => {
  try {
    const b = s.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b))));
  } catch {
    return null;
  }
};
const normalize = (raw: string) => {
  let v = raw.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try {
    const u = new URL(v);
    return u.hostname.includes(".") ? u.href : null;
  } catch {
    return null;
  }
};
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
const guessName = (u: string) => host(u).split(".")[0].replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

async function fetchMeta(u: string) {
  try { const r = await fetch("/api/icon?url=" + encodeURIComponent(u)); return r.ok ? await r.json() : {}; } catch { return {}; }
}

function Icon({ app, size = 56 }: { app: { name: string; url: string; emoji: string; icon?: string }; size?: number }) {
  const [bad, setBad] = useState(false);
  const box = { width: size, height: size, fontSize: size * 0.48 };
  if (app.emoji) return <div className="icon" style={box}>{app.emoji}</div>;
  if (app.icon && !bad)
    return (
      <div className="icon full" style={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={app.icon} alt="" width={size} height={size} onError={() => setBad(true)} />
      </div>
    );
  return <div className="icon" style={box}>{(app.name || "?")[0].toUpperCase()}</div>;
}

const svgp = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24" } as const;
const ShareGlyph = () => (
  <svg width="22" height="22" {...svgp}><path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1" /></svg>
);
const DotsGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
);
const PlusGlyph = () => (
  <svg width="22" height="22" {...svgp}><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" /></svg>
);
const Chevron = () => (
  <svg className="chev" width="18" height="18" {...svgp}><path d="M9 6l6 6-6 6" /></svg>
);

function InstallGuide({ single }: { single?: boolean }) {
  const [os, setOs] = useState<"ios" | "android">("ios");
  const [other, setOther] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setOs(/android/i.test(ua) ? "android" : "ios");
    setOther(/iPhone|iPad|iPod/i.test(ua) && /CriOS|FxiOS|EdgiOS|OPiOS|GSA|Instagram|FBAN|FBAV/i.test(ua));
  }, []);
  const steps =
    os === "ios"
      ? [
          { t: "Open this page in Safari", d: "The blue compass icon on your iPhone.", g: null },
          { t: "Tap the Share button", d: "The square with an arrow, at the bottom of the screen.", g: <ShareGlyph /> },
          { t: "Choose Add to Home Screen", d: "Scroll down in the menu if you don't see it.", g: <PlusGlyph /> },
          { t: "Tap Add", d: "It now sits on your home screen like any app.", g: null },
        ]
      : [
          { t: "Open this page in Chrome", d: "The round red, yellow, green and blue icon.", g: null },
          { t: "Open the browser menu", d: "Tap the three dots in the top right corner.", g: <DotsGlyph /> },
          { t: "Choose Install app", d: "Or Add to Home screen if you see that instead.", g: <PlusGlyph /> },
          { t: "Confirm", d: "Tap Install. The page now opens like an app.", g: null },
        ];
  return (
    <section className="guide" id="install">
      <h2>{single ? "Keep this on your phone" : "Keep these on your phone"}</h2>
      <p className="muted">Add this page to your home screen so {single ? "it's" : "everything is"} one tap away.</p>
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={os === "ios"} onClick={() => setOs("ios")}>iPhone</button>
        <button role="tab" aria-selected={os === "android"} onClick={() => setOs("android")}>Android</button>
      </div>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s.t}>
            <span className="num">{i + 1}</span>
            <div><strong>{s.t}</strong><span className="muted">{s.d}</span></div>
            {s.g && <span className="stepicon">{s.g}</span>}
          </li>
        ))}
      </ol>
      {os === "ios" && (
        <p className={"note" + (other ? " warn" : "")}>
          {other ? "You seem to be in another browser. " : ""}On iPhone, Add to Home Screen only works in Safari. If you opened this link elsewhere, copy it and paste it into Safari.
        </p>
      )}
    </section>
  );
}

type InstallEvent = Event & { prompt: () => Promise<void> };

function useInstall(solo: boolean, appUrl?: string) {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setDeferred(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  const guide = () => document.getElementById("install")?.scrollIntoView({ behavior: "smooth" });
  return async () => {
    const u = new URL(location.href);
    if (solo) u.searchParams.set("go", "1"); // the shortcut will jump straight to the app
    if (!solo && deferred) { await deferred.prompt(); setDeferred(null); return; }
    if (solo && /android/i.test(navigator.userAgent)) {
      history.replaceState(null, "", u.href); // Chrome's menu saves the current address
      return guide();
    }
    if (typeof navigator.share === "function") {
      try { await navigator.share({ url: appUrl ?? u.href }); } catch {}
      return;
    }
    guide();
  };
}

function PublicView({ data }: { data: Shared }) {
  const { s, a } = data;
  const solo = data.o && a.length === 1 ? a[0] : null;
   const install = useInstall(!!solo, solo?.url);
  const soloUrl = solo?.url;
  useEffect(() => {
    if (!soloUrl) return;
    const p = new URLSearchParams(location.search);
    if (!p.has("s")) return; // ignore the in-dashboard preview
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || p.get("go") === "1") location.replace(soloUrl);
  }, [soloUrl]);

  if (solo)
    return (
      <main className="wrap pub" style={{ ["--accent" as string]: s.accent }}>
        <header className="solo">
          {s.owner && <p className="eyebrow">Shared by {s.owner}</p>}
          <Icon app={solo} size={128} />
          <h1>{solo.name}</h1>
          {solo.desc && <p className="lead">{solo.desc}</p>}
          <p className="host">{host(solo.url)}</p>
          <div className="actions">
            <a className="pill" href={solo.url} target="_blank" rel="noopener noreferrer">Open</a>
            <button className="textlink" onClick={install}>Add to Home Screen</button>
          </div>
        </header>
        <InstallGuide single />
      </main>
    );

  return (
    <main className="wrap pub" style={{ ["--accent" as string]: s.accent }}>
      <header className="hero">
        {s.owner && <p className="eyebrow">From {s.owner}</p>}
        {a.length > 0 && (
          <div className="facepile">
            {a.slice(0, 5).map((x, i) => <Icon key={i} app={x} size={64} />)}
          </div>
        )}
        <h1>{s.title}</h1>
        <p className="lead">{s.intro}</p>
        <div className="actions">
          <a className="pill" href="#apps">See the apps</a>
          <button className="textlink" onClick={install}>Add to Home Screen</button>
        </div>
      </header>
      <div className="pgrid" id="apps">
        {a.map((x, i) => (
          <a key={i} className="pcard" style={{ ["--i" as string]: i }} href={x.url} target="_blank" rel="noopener noreferrer">
            <Icon app={x} size={68} />
            <div className="cardtext"><strong>{x.name}</strong><span className="muted">{x.desc || host(x.url)}</span></div>
            <span className="open">Open</span>
          </a>
        ))}
      </div>
      {a.length === 0 && <p className="empty">Nothing here yet.</p>}
      <InstallGuide />
    </main>
  );
}

const PATH = {
  share: "M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1",
  copy: "M9 9h10v10H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  plus: "M12 5v14M5 12h14",
  apps: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  page: "M6 3h8l5 5v13H6zM14 3v5h5M9 13h7M9 17h5",
};
const Ico = ({ d, size = 20, sw = 1.8 }: { d: string; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const countLabel = (n: number) => `${n} ${n === 1 ? "app" : "apps"}`;

export default function Page() {
  const [ready, setReady] = useState(false);
  const [shared, setShared] = useState<Shared | null>(null);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [set, setSet] = useState<Settings>(DEFAULTS);
  const [tab, setTab] = useState<"apps" | "page" | "share">("apps");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState<AppItem | null>(null);
  const [msg, setMsg] = useState("");
  const [msgDirty, setMsgDirty] = useState(false);
  const [toast, setToast] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewApp, setPreviewApp] = useState<AppItem | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("s");
    if (q) setShared(decode(q));
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const p = JSON.parse(raw); setApps((p.apps || []).map((x: AppItem) => ({ ...x, icon: x.icon ?? "" }))); setSet({ ...DEFAULTS, ...p.set }); }
    } catch {}
    setCanShare(typeof navigator.share === "function");
    setReady(true);
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify({ apps, set })); } catch {} }, [apps, set, ready]);

  const payload: Shared = { s: set, a: apps.map(({ id, ...r }) => r) };
  const link = ready ? `${location.origin}/?s=${encode(payload)}` : "";
  const linkFor = (x: AppItem) => {
    const { id, ...rest } = x;
    return `${location.origin}/?s=${encode({ s: set, a: [rest], o: 1 })}`;
  };
  const defaultMsg = `Hey! I put together a few apps I built in one place. Take a look: ${link}\n\nIf you open it on your phone, there's a quick guide at the bottom to add it to your home screen.`;
  useEffect(() => { if (!msgDirty) setMsg(defaultMsg); }, [defaultMsg, msgDirty]);

  const editing = !!edit;
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setEdit(null); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [editing]);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 1800); };
  const copy = async (t: string, label: string) => {
    try { await navigator.clipboard.writeText(t); flash(label); } catch { flash("Copy failed. Select the text and copy it."); }
  };
  const copyOne = (x: AppItem) => copy(linkFor(x), `${x.name} link copied`);
  const shareOne = async (x: AppItem) => {
    if (!canShare) return copyOne(x);
    try { await navigator.share({ url: linkFor(x) }); } catch {}
  };
  const sharePage = async () => {
    if (!canShare) return copy(link, "Link copied");
    try { await navigator.share({ url: link }); } catch {}
  };
  const nativeShare = async () => { try { await navigator.share({ text: msg }); } catch {} };

  const add = async () => {
    const u = normalize(url);
    if (!u) return setErr("Enter a valid web address, like myapp.vercel.app");
    if (apps.some((a) => a.url === u)) return setErr("That app is already in your list.");
    setErr(""); setBusy(true);
    const m = await fetchMeta(u);
    const t = (m.title || "").split(/\s[|–—-]\s/)[0].trim().slice(0, 28);
    setApps((cur) => [...cur, { id: uid(), name: t || guessName(u), desc: (m.description || "").slice(0, 90), url: u, emoji: "", icon: m.icon || "" }]);
    setUrl(""); setBusy(false);
    flash(m.icon ? "Added with its icon" : "Added");
  };
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= apps.length) return;
    const c = [...apps]; [c[i], c[j]] = [c[j], c[i]]; setApps(c);
  };
  const saveEdit = () => {
    if (!edit) return;
    const u = normalize(edit.url);
    if (!u || !edit.name.trim()) return setErr("Name and a valid address are required.");
    setApps(apps.map((a) => (a.id === edit.id ? { ...edit, url: u, name: edit.name.trim() } : a)));
    setEdit(null); setErr("");
  };

  if (!ready) return null;
  if (shared) return <PublicView data={shared} />;
  if (preview)
    return (
      <>
        <button className="d-previewbar" onClick={() => { setPreview(false); setPreviewApp(null); }}>Close preview</button>
        <PublicView data={previewApp ? { s: set, a: [(({ id, ...r }) => r)(previewApp)], o: 1 } : payload} />
      </>
    );

  const tabs = [
    { id: "apps", label: "Apps", d: PATH.apps },
    { id: "page", label: "Your page", d: PATH.page },
    { id: "share", label: "Share", d: PATH.share },
  ] as const;
  const idx = tabs.findIndex((t) => t.id === tab);
  const head = {
    apps: ["Apps", apps.length ? `${countLabel(apps.length)} on your page` : "Start by adding a link"],
    page: ["Your page", "What people see when they open your link"],
    share: ["Share", "Send your whole page or a single app"],
  }[tab];
  const ei = edit ? apps.findIndex((a) => a.id === edit.id) : -1;

  return (
    <div className="d-root">
      <main className="d-shell">
        <header className="d-head">
          <div>
            <h1 className="d-title">{head[0]}</h1>
            <p className="d-sub">{head[1]}</p>
          </div>
          <button className="d-btn sm" onClick={() => setPreview(true)}><Ico d={PATH.eye} size={16} />Preview</button>
        </header>

        {tab === "apps" && (
          <>
            {apps.length > 0 && (
              <div className="d-page">
                <div className="d-pile">{apps.slice(0, 3).map((a) => <Icon key={a.id} app={a} size={40} />)}</div>
                <div className="d-txt">
                  <strong>{set.title || "Your page"}</strong>
                  <span>{countLabel(apps.length)} · one link for everything</span>
                </div>
                <div className="d-pbtns">
                  <button className="d-btn primary" onClick={() => copy(link, "Link copied")}><Ico d={PATH.copy} size={16} />Copy link</button>
                  {canShare && <button className="d-btn" onClick={sharePage}><Ico d={PATH.share} size={16} />Share</button>}
                </div>
              </div>
            )}

            <div className="d-add">
              <Ico d={PATH.link} size={18} />
              <input value={url} onChange={(e) => { setUrl(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Paste an app link" inputMode="url" autoCapitalize="none" autoCorrect="off" aria-label="App URL" />
              <button className="d-btn primary" onClick={add} disabled={busy}>{busy ? "Adding…" : "Add"}</button>
            </div>
            {err && !edit && <p className="d-err">{err}</p>}

            {apps.length === 0 ? (
              <div className="d-empty">
                <div className="d-emptyico"><Ico d={PATH.plus} size={26} /></div>
                <strong>No apps yet</strong>
                <span>Paste a link above. Its icon and name are added for you.</span>
              </div>
            ) : (
              <>
                <div className="d-sech"><span>Your apps</span><span>Tap to edit</span></div>
                <div className="d-grid">
                  {apps.map((a, i) => (
                    <div key={a.id} className="d-app" role="button" tabIndex={0} style={{ ["--i" as string]: i }}
                      onClick={() => { setEdit(a); setErr(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { setEdit(a); setErr(""); } }}>
                      <Icon app={a} size={52} />
                      <div className="d-txt"><strong>{a.name}</strong><span>{host(a.url)}</span></div>
                      <button className="d-icobtn" aria-label={`Share ${a.name}`} onClick={(e) => { e.stopPropagation(); shareOne(a); }}>
                        <Ico d={canShare ? PATH.share : PATH.copy} size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="d-hint">Use the button on each app to share just that one.</p>
              </>
            )}
          </>
        )}

        {tab === "page" && (
          <div className="d-col">
            <div className="d-mini" style={{ ["--accent" as string]: set.accent }}>
              <small>Live preview</small>
              {apps.length > 0 && <div className="d-pile">{apps.slice(0, 4).map((a) => <Icon key={a.id} app={a} size={44} />)}</div>}
              <h3>{set.title || "Your title"}</h3>
              <p>{set.intro}</p>
              <span className="d-minipill">See the apps</span>
            </div>
            <section className="d-sec">
              <h3>Content</h3>
              <div className="d-group">
                <label className="d-row"><span>Your name</span><input value={set.owner} onChange={(e) => setSet({ ...set, owner: e.target.value })} placeholder="Optional" /></label>
                <label className="d-row"><span>Title</span><input value={set.title} onChange={(e) => setSet({ ...set, title: e.target.value })} /></label>
                <label className="d-row top"><span>Intro</span><textarea rows={4} value={set.intro} onChange={(e) => setSet({ ...set, intro: e.target.value })} /></label>
              </div>
            </section>
            <section className="d-sec">
              <h3>Accent color</h3>
              <div className="d-group">
                <div className="d-row">
                  <div className="d-swatches">
                    {ACCENTS.map((c) => (
                      <button key={c} aria-label={c} aria-pressed={set.accent === c} className="d-sw" style={{ background: c }} onClick={() => setSet({ ...set, accent: c })} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <button className="d-btn primary block" onClick={() => setPreview(true)}>Preview full page</button>
          </div>
        )}

        {tab === "share" && (
          <div className="d-col">
            {apps.length === 0 ? (
              <div className="d-empty">
                <div className="d-emptyico"><Ico d={PATH.share} size={26} /></div>
                <strong>Nothing to share yet</strong>
                <span>Add at least one app and your links will appear here.</span>
                <button className="d-btn primary sm" style={{ marginTop: 10 }} onClick={() => setTab("apps")}>Add an app</button>
              </div>
            ) : (
              <>
                <section className="d-sec">
                  <h3>Your whole page</h3>
                  <div className="d-linkcard">
                    <div className="d-linkhead">
                      <div className="d-pile">{apps.slice(0, 4).map((a) => <Icon key={a.id} app={a} size={40} />)}</div>
                      <div className="d-txt"><strong>{set.title || "Your page"}</strong><span>{countLabel(apps.length)}</span></div>
                    </div>
                    <div className="d-url">{link}</div>
                    <div className="d-actions">
                      <button className="d-btn primary" onClick={() => copy(link, "Link copied")}>Copy link</button>
                      {canShare && <button className="d-btn" onClick={sharePage}>Share…</button>}
                      <button className="d-btn" onClick={() => setPreview(true)}>Preview</button>
                    </div>
                  </div>
                  <p className="d-foot">This link contains your apps and settings. Send a new link after you make changes.</p>
                </section>

                <section className="d-sec">
                  <h3>Individual apps</h3>
                  <div className="d-group">
                    {apps.map((a) => (
                      <div className="d-row" key={a.id}>
                        <Icon app={a} size={40} />
                        <div className="d-txt"><strong>{a.name}</strong><span>{host(a.url)}</span></div>
                        <button className="d-btn sm" onClick={() => copyOne(a)}>Copy</button>
                        {canShare && <button className="d-icobtn" aria-label={`Share ${a.name}`} onClick={() => shareOne(a)}><Ico d={PATH.share} size={18} /></button>}
                      </div>
                    ))}
                  </div>
                  <p className="d-foot">Each app gets its own page with a big Open button.</p>
                </section>

                <section className="d-sec">
                  <h3>Message</h3>
                  <div className="d-group"><div className="d-row"><textarea rows={6} value={msg} onChange={(e) => { setMsg(e.target.value); setMsgDirty(true); }} /></div></div>
                  <p className="d-foot">Edit the text before you send it.{msgDirty && <> <button onClick={() => setMsgDirty(false)}>Reset</button></>}</p>
                  <div className="d-actions" style={{ marginTop: 14 }}>
                    <button className="d-btn" onClick={() => copy(msg, "Message copied")}>Copy message</button>
                    {canShare && <button className="d-btn" onClick={nativeShare}>Share…</button>}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </main>

      <nav className="d-nav" role="tablist" style={{ ["--idx" as string]: idx }}>
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setErr(""); }}>
            <Ico d={t.d} size={24} sw={1.7} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {edit && (
        <div className="d-overlay" onClick={() => setEdit(null)}>
          <div className="d-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit app">
            <div className="d-sheethead">
              <button className="d-link" onClick={() => setEdit(null)}>Cancel</button>
              <h2>Edit app</h2>
              <button className="d-link bold" onClick={saveEdit}>Save</button>
            </div>

            <div className="d-sheethero">
              <Icon key={`${edit.icon}|${edit.emoji}`} app={edit} size={76} />
              <strong>{edit.name || "Untitled"}</strong>
              <span>{host(edit.url)}</span>
            </div>

            <div className="d-actions">
              <button className="d-btn primary" onClick={() => copyOne(edit)}>Copy link</button>
              {canShare && <button className="d-btn" onClick={() => shareOne(edit)}>Share…</button>}
              <button className="d-btn" onClick={() => { setPreviewApp(edit); setEdit(null); setPreview(true); }}>Preview</button>
            </div>

            <div className="d-group">
              <label className="d-row"><span>Name</span><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
              <label className="d-row"><span>Description</span><input value={edit.desc} maxLength={90} onChange={(e) => setEdit({ ...edit, desc: e.target.value })} placeholder="One short line" /></label>
              <label className="d-row"><span>Link</span><input value={edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} inputMode="url" autoCapitalize="none" /></label>
              <label className="d-row"><span>Emoji</span><input value={edit.emoji} maxLength={4} onChange={(e) => setEdit({ ...edit, emoji: e.target.value })} placeholder="Or empty for site icon" /></label>
              <label className="d-row"><span>Icon URL</span><input value={edit.icon ?? ""} onChange={(e) => setEdit({ ...edit, icon: e.target.value })} placeholder="Fetched automatically" autoCapitalize="none" /></label>
            </div>
            {err && <p className="d-err" style={{ margin: "-6px 6px 0" }}>{err}</p>}

            <div className="d-actions">
              <button className="d-btn" disabled={ei <= 0} onClick={() => move(ei, -1)}>← Earlier</button>
              <button className="d-btn" disabled={ei >= apps.length - 1} onClick={() => move(ei, 1)}>Later →</button>
              <button className="d-btn" onClick={async () => { const m = await fetchMeta(edit.url); if (m.icon) { setEdit({ ...edit, icon: m.icon, emoji: "" }); flash("Icon updated"); } else flash("No icon found"); }}>Get icon</button>
            </div>

            <button className="d-btn danger block" onClick={() => { if (confirm(`Delete ${edit.name}?`)) { setApps(apps.filter((a) => a.id !== edit.id)); setEdit(null); } }}>Delete app</button>
          </div>
        </div>
      )}

      {toast && <div className="d-toast" role="status">{toast}</div>}
      <meta name="theme-color" content="#f5f5f7" />
    </div>
  );
}