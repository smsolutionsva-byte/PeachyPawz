const SHARE_CACHE = "peachypawz-share-v1";
const SHARE_PATH = "/share-target";
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 4;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname !== SHARE_PATH || event.request.method !== "POST") return;
  event.respondWith(handleShare(event.request));
});

async function handleShare(request) {
  try {
    const form = await request.formData();
    const id = `share-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const cache = await caches.open(SHARE_CACHE);
    const title = String(form.get("title") || "").slice(0, 300);
    const text = String(form.get("text") || "").slice(0, 20000);
    const url = String(form.get("url") || "").slice(0, 2000);
    const rawFiles = form.getAll("files").filter((item) => item && typeof item === "object" && "arrayBuffer" in item).slice(0, MAX_FILES);
    const files = [];

    for (let index = 0; index < rawFiles.length; index += 1) {
      const file = rawFiles[index];
      if (!file.size || file.size > MAX_FILE_BYTES) continue;
      const type = file.type || "application/octet-stream";
      const allowed = type.startsWith("image/") || type === "application/pdf";
      if (!allowed) continue;
      const key = `/__peachy_share__/${encodeURIComponent(id)}/file-${index}`;
      await cache.put(key, new Response(file, { headers: { "Content-Type": type } }));
      files.push({ key, name: String(file.name || `shared-file-${index + 1}`).slice(0, 240), type, size: file.size });
    }

    const payload = {
      id,
      title,
      text,
      url,
      capturedAt: new Date().toISOString(),
      files,
      source: "android-share-sheet"
    };

    await cache.put(`/__peachy_share__/${encodeURIComponent(id)}/meta`, new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    }));
    await cache.put("/__peachy_share__/latest", new Response(id, { headers: { "Cache-Control": "no-store" } }));

    return Response.redirect(`${self.location.origin}/?peachyShare=${encodeURIComponent(id)}`, 303);
  } catch {
    return Response.redirect(`${self.location.origin}/?peachyShareError=1`, 303);
  }
}
