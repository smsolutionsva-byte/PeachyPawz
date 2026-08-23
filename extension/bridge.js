let attempts = 0;
let timer = null;

async function deliverPendingCapture() {
  const { pendingPeachyCapture } = await chrome.storage.local.get("pendingPeachyCapture");
  if (!pendingPeachyCapture) {
    if (timer) clearInterval(timer);
    return;
  }
  if (pendingPeachyCapture.expiresAt && Date.now() > pendingPeachyCapture.expiresAt) {
    await chrome.storage.local.remove("pendingPeachyCapture");
    return;
  }
  window.postMessage({
    source: "peachypawz-extension",
    type: "PEACHY_CAPTURE",
    payload: pendingPeachyCapture,
  }, window.location.origin);
  attempts += 1;
  if (attempts >= 60 && timer) clearInterval(timer);
}

window.addEventListener("message", async (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  if (event.data?.source !== "peachypawz-web" || event.data?.type !== "PEACHY_CAPTURE_ACK") return;
  const { pendingPeachyCapture } = await chrome.storage.local.get("pendingPeachyCapture");
  if (pendingPeachyCapture?.id === event.data.id) {
    await chrome.storage.local.remove("pendingPeachyCapture");
    if (timer) clearInterval(timer);
  }
});

deliverPendingCapture().catch(() => {});
timer = setInterval(() => deliverPendingCapture().catch(() => {}), 1000);
