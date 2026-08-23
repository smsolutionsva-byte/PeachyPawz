const PEACHY_URL = "https://peachypawz.vercel.app/";
const pageTitle = document.getElementById("pageTitle");
const pageDomain = document.getElementById("pageDomain");
const selectionNote = document.getElementById("selectionNote");
const status = document.getElementById("status");
const askButton = document.getElementById("askButton");
const importButton = document.getElementById("importButton");

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function previewTab() {
  const tab = await activeTab();
  if (!tab?.url) return;
  try {
    const url = new URL(tab.url);
    pageTitle.textContent = tab.title || "Current page";
    pageDomain.textContent = url.hostname || url.protocol;
  } catch {
    pageTitle.textContent = tab.title || "Current page";
  }
}

async function captureVisiblePage(mode) {
  status.textContent = "Reading visible page text…";
  askButton.disabled = true;
  importButton.disabled = true;
  try {
    const tab = await activeTab();
    if (!tab?.id || !tab.url || !/^https?:/i.test(tab.url)) {
      throw new Error("Open a normal website page first. Browser settings and extension pages cannot be captured.");
    }

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const selection = window.getSelection()?.toString().trim() || "";
        const root = document.querySelector("main, [role='main'], article") || document.body;
        const visibleText = (root?.innerText || document.body?.innerText || "")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        return {
          title: document.title || "Untitled page",
          url: location.href,
          text: visibleText.slice(0, 20000),
          selectedText: selection.slice(0, 5000),
        };
      },
    });

    if (!result?.text && !result?.selectedText) throw new Error("I couldn't find readable visible text on this page.");

    const now = Date.now();
    const payload = {
      id: `capture-${now}-${Math.random().toString(36).slice(2, 8)}`,
      mode,
      title: result.title,
      url: result.url,
      text: result.text,
      selectedText: result.selectedText,
      capturedAt: new Date(now).toISOString(),
      expiresAt: now + 10 * 60 * 1000,
    };

    await chrome.storage.local.set({ pendingPeachyCapture: payload });
    await chrome.tabs.create({ url: `${PEACHY_URL}?peachyExtension=${mode}` });
    status.textContent = "Opening PeachyPawz for review…";
    window.close();
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "This page could not be captured.";
    askButton.disabled = false;
    importButton.disabled = false;
  }
}

askButton.addEventListener("click", () => captureVisiblePage("ask"));
importButton.addEventListener("click", () => captureVisiblePage("import"));

previewTab().catch(() => {});
