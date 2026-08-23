import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Fallback for browsers that POST to the share target before the PWA service
// worker controls the page. Installed Android PWAs normally use /public/sw.js,
// which can safely hand shared files to the client through Cache Storage.
export async function POST(request: Request) {
  const form = await request.formData();
  const files = form.getAll("files").filter((item) => item instanceof File && item.size > 0);
  const redirect = new URL("/", request.url);

  if (files.length) {
    redirect.searchParams.set("peachyShareError", "install");
    return NextResponse.redirect(redirect, 303);
  }

  redirect.searchParams.set("peachyShareFallback", "1");
  const title = String(form.get("title") || "").slice(0, 300);
  const text = String(form.get("text") || "").slice(0, 5000);
  const url = String(form.get("url") || "").slice(0, 1500);
  if (title) redirect.searchParams.set("sharedTitle", title);
  if (text) redirect.searchParams.set("sharedText", text);
  if (url) redirect.searchParams.set("sharedUrl", url);
  return NextResponse.redirect(redirect, 303);
}
