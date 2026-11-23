import type { Metadata } from "next";
import { Suspense } from "react";
import App from "./App";

type Shared = {
  s: { owner: string; title: string; intro: string; accent: string };
  a: { name: string; desc: string; url: string }[];
  o?: 1;
};
type SP = Promise<{ s?: string | string[] }>;

const decode = (s: string): Shared | null => {
  try {
    return JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};
const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const raw = (await searchParams).s;
  const q = Array.isArray(raw) ? raw[0] : raw;
  const data = q ? decode(q) : null;
  if (!q || !data) return {};

  const solo = data.o && data.a.length === 1 ? data.a[0] : null;
  const title = solo ? solo.name : data.s.title;
  const description = solo
    ? solo.desc || host(solo.url)
    : data.s.owner
      ? `From ${data.s.owner} · ${data.a.length} ${data.a.length === 1 ? "app" : "apps"}`
      : data.s.intro;
  const image = `/og?s=${q}`;

  return {
    title,
    description,
    manifest: `/manifest?s=${q}`,
    ...(solo && {
      icons: { apple: `/apple-icon?s=${q}` },
      appleWebApp: { title: solo.name },
    }),
    openGraph: { title, description, type: "website", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

async function Content({ searchParams }: { searchParams: SP }) {
  await searchParams; // keeps the page dynamic so the tags above can depend on the link
  return <App />;
}

export default function Page({ searchParams }: { searchParams: SP }) {
  return (
    <Suspense fallback={null}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}