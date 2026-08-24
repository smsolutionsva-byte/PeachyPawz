"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileSearch,
  FileText,
  Home,
  Info,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { analyzePet, evidenceFor, metricSeries } from "@/lib/analytics";
import { pets as demoPets, seedEvents as demoEvents } from "@/lib/seed";
import { AnalyticsResult, ChatAnswer, ChatTurn, EventType, HealthEvent, Pet } from "@/lib/types";
import { EventIcon } from "./EventIcon";
import { Sparkline } from "./Sparkline";

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "timeline", label: "Timeline", icon: CalendarDays },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "ask", label: "Ask", icon: MessageCircle },
] as const;
type View = (typeof navItems)[number]["id"];
type StartMode = "upload" | "manual" | "empty" | "demo";

type AuthUser = { id: string; name?: string | null; email?: string | null; image?: string | null };
type Workspace = {
  version: 2;
  pets: Pet[];
  events: HealthEvent[];
  selectedPetId: string;
  aiConsent: boolean;
};

type WebCapture = {
  id: string;
  mode: "ask" | "import";
  title: string;
  url: string;
  text: string;
  selectedText?: string;
  capturedAt: string;
  expiresAt?: number;
  origin?: "extension" | "mobile-share";
};

type PeachyShareFileMeta = { key: string; name: string; type: string; size: number };
type PeachySharePayload = {
  id: string;
  title: string;
  text: string;
  url: string;
  capturedAt: string;
  files: PeachyShareFileMeta[];
  source?: string;
  loadedFiles: File[];
};

const eventLabels: Record<EventType, string> = {
  weight: "Weight",
  activity: "Activity",
  appetite: "Appetite",
  diet: "Diet",
  symptom: "Symptom",
  medication: "Medication",
  vaccine: "Vaccine",
  vet: "Vet Visit",
  lab: "Lab",
  note: "Note",
  document: "Document",
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00`));

const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00`));

const todayDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ageLabel = (birthDate: string) => {
  if (!birthDate) return "Age not added";
  const birth = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return "Age not added";
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const beforeBirthday = now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) years -= 1;
  return years <= 0 ? "Under 1 year" : `${years} year${years === 1 ? "" : "s"}`;
};

const sourceText = (event: HealthEvent) => {
  if (event.sourceLabel) return event.sourceLabel;
  if (event.source === "document_ai") return "Imported document";
  if (event.source === "device") return "Connected device";
  if (event.source === "vet") return "Veterinary record";
  return "Manual entry";
};

export default function PeachyApp({ user, aiAvailable, signOutAction }: { user: AuthUser; aiAvailable: boolean; signOutAction: () => Promise<void> }) {
  const storageKey = `peachypawz:workspace:v2:${encodeURIComponent(user.id)}`;
  const webCaptureKey = `peachypawz:web-capture:v1:${encodeURIComponent(user.id)}`;
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>("home");
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [aiConsent, setAiConsent] = useState(false);
  const [evidenceIds, setEvidenceIds] = useState<string[] | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);
  const [vetOpen, setVetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [petOpen, setPetOpen] = useState(false);
  const [recordEvent, setRecordEvent] = useState<HealthEvent | null>(null);
  const [webCapture, setWebCapture] = useState<WebCapture | null>(null);
  const [mobileShare, setMobileShare] = useState<PeachySharePayload | null>(null);
  const [sharedUploadFile, setSharedUploadFile] = useState<File | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Workspace;
        if (parsed.version === 2 && Array.isArray(parsed.pets)) {
          setUserPets(parsed.pets);
          setEvents(Array.isArray(parsed.events) ? parsed.events : []);
          setSelectedPetId(parsed.selectedPetId || parsed.pets[0]?.id || "");
          setAiConsent(Boolean(parsed.aiConsent));
        }
      }
    } catch {}
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || userPets.length === 0) return;
    const workspace: Workspace = { version: 2, pets: userPets, events, selectedPetId, aiConsent };
    try { localStorage.setItem(storageKey, JSON.stringify(workspace)); } catch {}
  }, [hydrated, storageKey, userPets, events, selectedPetId, aiConsent]);

  useEffect(() => {
    try {
      const storedCapture = sessionStorage.getItem(webCaptureKey);
      if (storedCapture) {
        const parsed = JSON.parse(storedCapture) as WebCapture;
        if (!parsed.expiresAt || Date.now() <= parsed.expiresAt) setWebCapture(parsed);
        else sessionStorage.removeItem(webCaptureKey);
      }
    } catch {}

    const receiveExtensionCapture = (messageEvent: MessageEvent) => {
      if (messageEvent.source !== window || messageEvent.origin !== window.location.origin) return;
      const message = messageEvent.data as { source?: string; type?: string; payload?: WebCapture };
      if (message?.source !== "peachypawz-extension" || message?.type !== "PEACHY_CAPTURE" || !message.payload) return;
      const capture = message.payload;
      if (!capture.id || !capture.url || (!capture.text && !capture.selectedText)) return;
      if (capture.expiresAt && Date.now() > capture.expiresAt) return;
      setWebCapture(capture);
      try { sessionStorage.setItem(webCaptureKey, JSON.stringify(capture)); } catch {}
      window.postMessage({ source: "peachypawz-web", type: "PEACHY_CAPTURE_ACK", id: capture.id }, window.location.origin);
    };
    window.addEventListener("message", receiveExtensionCapture);
    return () => window.removeEventListener("message", receiveExtensionCapture);
  }, [webCaptureKey]);

  useEffect(() => {
    let cancelled = false;

    const loadPeachyShare = async () => {
      if (!("caches" in window)) return;
      try {
        const params = new URLSearchParams(window.location.search);
        const cache = await caches.open("peachypawz-share-v1");
        let id = params.get("peachyShare") || "";
        if (!id) id = (await (await cache.match("/__peachy_share__/latest"))?.text()) || "";

        if (id) {
          const metaResponse = await cache.match(`/__peachy_share__/${encodeURIComponent(id)}/meta`);
          if (metaResponse) {
            const meta = await metaResponse.json() as Omit<PeachySharePayload, "loadedFiles">;
            const loadedFiles: File[] = [];
            for (const item of meta.files || []) {
              const response = await cache.match(item.key);
              if (!response) continue;
              const blob = await response.blob();
              loadedFiles.push(new File([blob], item.name, { type: item.type || blob.type, lastModified: Date.now() }));
            }
            if (!cancelled) setMobileShare({ ...meta, loadedFiles });
            window.history.replaceState({}, "", window.location.pathname);
            return;
          }
        }

        if (params.get("peachyShareFallback") === "1") {
          const fallback: PeachySharePayload = {
            id: `share-fallback-${Date.now()}`,
            title: params.get("sharedTitle") || "Shared with PeachyPawz",
            text: params.get("sharedText") || "",
            url: params.get("sharedUrl") || "",
            capturedAt: new Date().toISOString(),
            files: [],
            source: "share-target-fallback",
            loadedFiles: [],
          };
          if (!cancelled) setMobileShare(fallback);
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch {
        // Sharing is an enhancement; the core timeline remains available.
      }
    };

    void loadPeachyShare();
    return () => { cancelled = true; };
  }, []);

  const pet = userPets.find((item) => item.id === selectedPetId) || userPets[0] || null;
  const petEvents = useMemo(() => pet ? events.filter((event) => event.petId === pet.id).sort((a, b) => b.date.localeCompare(a.date)) : [], [events, pet]);
  const analytics = useMemo(() => pet ? analyzePet(events, pet.id) : null, [events, pet]);
  const evidence = useMemo(() => evidenceIds ? evidenceFor(events, evidenceIds) : [], [events, evidenceIds]);

  const completeOnboarding = (newPet: Pet, consent: boolean, startMode: StartMode) => {
    if (startMode === "demo") {
      setUserPets(demoPets);
      setEvents(demoEvents);
      setSelectedPetId("max");
      setAiConsent(consent);
      setView("home");
      return;
    }
    setUserPets([newPet]);
    setEvents([]);
    setSelectedPetId(newPet.id);
    setAiConsent(consent);
    setView("home");
    if (startMode === "upload") setUploadOpen(true);
    if (startMode === "manual") setAddOpen(true);
  };

  const addEvent = (event: HealthEvent) => setEvents((current) => [event, ...current]);
  const addEvents = (newEvents: HealthEvent[]) => setEvents((current) => [...newEvents, ...current]);
  const addPet = (newPet: Pet) => {
    setUserPets((current) => [...current, newPet]);
    setSelectedPetId(newPet.id);
    setPetOpen(false);
    setView("home");
  };
  const updateEvent = (updated: HealthEvent) => {
    setEvents((current) => current.map((item) => item.id === updated.id ? { ...updated, reviewStatus: "corrected", updatedAt: new Date().toISOString() } : item));
    setRecordEvent(null);
  };
  const deleteEvent = (eventId: string) => {
    setEvents((current) => current.filter((item) => item.id !== eventId));
    setRecordEvent(null);
  };
  const closeWebCapture = () => {
    try { sessionStorage.removeItem(webCaptureKey); } catch {}
    setWebCapture(null);
  };
  const clearMobileShareCache = async (share: PeachySharePayload | null) => {
    if (!share || !("caches" in window)) return;
    try {
      const cache = await caches.open("peachypawz-share-v1");
      await Promise.all((share.files || []).map((item) => cache.delete(item.key)));
      await cache.delete(`/__peachy_share__/${encodeURIComponent(share.id)}/meta`);
      const latest = await cache.match("/__peachy_share__/latest");
      if ((await latest?.text()) === share.id) await cache.delete("/__peachy_share__/latest");
    } catch {}
  };
  const closeMobileShare = () => {
    const current = mobileShare;
    setMobileShare(null);
    void clearMobileShareCache(current);
  };
  const openSharedText = () => {
    if (!mobileShare) return;
    const text = [mobileShare.text, mobileShare.url].filter(Boolean).join("\n").trim();
    setWebCapture({
      id: mobileShare.id,
      mode: "import",
      title: mobileShare.title || "Shared mobile content",
      url: /^https?:\/\//i.test(mobileShare.url) ? mobileShare.url : `${window.location.origin}/shared-content`,
      text,
      capturedAt: mobileShare.capturedAt,
      expiresAt: Date.now() + 10 * 60 * 1000,
      origin: "mobile-share",
    });
    const current = mobileShare;
    setMobileShare(null);
    void clearMobileShareCache(current);
  };
  const openSharedFile = (file: File) => {
    const current = mobileShare;
    setSharedUploadFile(file);
    setMobileShare(null);
    setUploadOpen(true);
    void clearMobileShareCache(current);
  };
  const loadDemo = () => {
    setUserPets(demoPets);
    setEvents(demoEvents);
    setSelectedPetId("max");
    setView("home");
  };
  const resetProfile = () => {
    try {
      localStorage.removeItem(storageKey);
      const chatPrefix = `peachypawz:chat:v1:${encodeURIComponent(user.id)}:`;
      const chatKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => Boolean(key?.startsWith(chatPrefix)));
      chatKeys.forEach((key) => localStorage.removeItem(key));
    } catch {}
    setUserPets([]);
    setEvents([]);
    setSelectedPetId("");
    setAiConsent(false);
    setView("home");
  };

  if (!hydrated) return <div className="app-boot"><span className="spinner" /><p>Opening your private pet workspace…</p></div>;
  if (!pet || !analytics) return <Onboarding user={user} aiAvailable={aiAvailable} onComplete={completeOnboarding} />;

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <BrandMark />
        <nav className="side-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`side-nav-item ${view === item.id ? "active" : ""}`} onClick={() => setView(item.id)}>
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <button className="vet-side-card" onClick={() => setVetOpen(true)}>
          <span className="vet-side-icon"><Stethoscope size={18} /></span>
          <span><strong>Prepare for Vet</strong><small>Create a factual 90-day brief</small></span>
          <ChevronRight size={16} />
        </button>
        <p className="sidebar-privacy"><ShieldCheck size={14} /> Records stay scoped to the selected pet.</p>
      </aside>

      <main className="main-shell">
        <header className="mobile-header">
          <BrandMark compact />
          <div className="mobile-header-actions">
            <PetSwitcher pet={pet} pets={userPets} selectedId={selectedPetId} onSelect={setSelectedPetId} onAddPet={() => setPetOpen(true)} />
            <button className="account-avatar-button mobile-account-button" aria-label="Open account menu" onClick={() => setAccountOpen((value) => !value)}>
              {user.image ? <img src={user.image} alt="" /> : <span>{(user.name || user.email || "U")[0]?.toUpperCase()}</span>}
            </button>
          </div>
        </header>

        <div className="topbar">
          <div>
            <p className="eyebrow">Health intelligence timeline</p>
            <h1>{view === "home" ? `${pet.name}'s health story` : navItems.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <PetSwitcher pet={pet} pets={userPets} selectedId={selectedPetId} onSelect={setSelectedPetId} onAddPet={() => setPetOpen(true)} />
            <button className="button secondary desktop-only" onClick={() => setUploadOpen(true)}><Upload size={17} /> Import record</button>
            <button className="button primary desktop-only" onClick={() => setAddOpen(true)}><Plus size={17} /> Add record</button>
            <div className="account-menu-wrap desktop-account">
              <button className="account-avatar-button" aria-label="Open account menu" onClick={() => setAccountOpen((value) => !value)}>
                {user.image ? <img src={user.image} alt="" /> : <span>{(user.name || user.email || "U")[0]?.toUpperCase()}</span>}
              </button>
              {accountOpen && <AccountMenu user={user} aiAvailable={aiAvailable} aiConsent={aiConsent} onReset={() => { setAccountOpen(false); if (window.confirm("Start fresh? This clears PeachyPawz data saved in this browser for this account.")) resetProfile(); }} signOutAction={signOutAction} />}
            </div>
          </div>
        </div>

        {accountOpen && <div className="mobile-account-popover"><AccountMenu user={user} aiAvailable={aiAvailable} aiConsent={aiConsent} onReset={() => { setAccountOpen(false); if (window.confirm("Start fresh? This clears PeachyPawz data saved in this browser for this account.")) resetProfile(); }} signOutAction={signOutAction} /></div>}

        <section className="content-wrap">
          {view === "home" && (
            <HomeView pet={pet} events={petEvents} analytics={analytics} onEvidence={setEvidenceIds} onStory={() => setStoryOpen(true)} onVet={() => setVetOpen(true)} onAsk={() => setView("ask")} onTimeline={() => setView("timeline")} onAdd={() => setAddOpen(true)} onUpload={() => setUploadOpen(true)} onDemo={loadDemo} />
          )}
          {view === "timeline" && <TimelineView pet={pet} events={petEvents} onAdd={() => setAddOpen(true)} onUpload={() => setUploadOpen(true)} onEvent={setRecordEvent} />}
          {view === "insights" && <InsightsView pet={pet} analytics={analytics} events={petEvents} onEvidence={setEvidenceIds} onStory={() => setStoryOpen(true)} />}
          {view === "ask" && <AskView pet={pet} events={petEvents} allowAI={aiConsent && aiAvailable} storageKey={`peachypawz:chat:v1:${encodeURIComponent(user.id)}:${pet.id}`} />}
        </section>
      </main>

      <button className="mobile-fab" onClick={() => setAddOpen(true)} aria-label="Add health record"><Plus size={24} /></button>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><Icon size={20} /><span>{item.label}</span></button>;
        })}
      </nav>

      {evidenceIds && <EvidenceDrawer pet={pet} insight={analytics.primaryInsight} evidence={evidence} onClose={() => setEvidenceIds(null)} />}
      {storyOpen && <StoryModal pet={pet} events={petEvents} allowAI={aiConsent && aiAvailable} onClose={() => setStoryOpen(false)} />}
      {vetOpen && <VetBriefModal pet={pet} events={petEvents} onClose={() => setVetOpen(false)} />}
      {addOpen && <AddEventSheet pet={pet} onAdd={addEvent} onClose={() => setAddOpen(false)} onUpload={() => { setAddOpen(false); setUploadOpen(true); }} />}
      {uploadOpen && <UploadSheet pet={pet} existingEvents={petEvents} allowAI={aiConsent && aiAvailable} initialFile={sharedUploadFile} onAdd={addEvent} onClose={() => { setUploadOpen(false); setSharedUploadFile(null); }} />}
      {mobileShare && <MobileShareSheet share={mobileShare} pet={pet} onUseText={openSharedText} onUseFile={openSharedFile} onClose={closeMobileShare} />}
      {petOpen && <AddPetSheet onAdd={addPet} onClose={() => setPetOpen(false)} />}
      {recordEvent && <RecordEditorSheet event={recordEvent} onSave={updateEvent} onDelete={deleteEvent} onClose={() => setRecordEvent(null)} />}
      {webCapture && <WebCaptureSheet capture={webCapture} pet={pet} existingEvents={petEvents} allowAI={aiConsent && aiAvailable} onAddMany={addEvents} onClose={closeWebCapture} />}
    </div>
  );
}

function AccountMenu({ user, aiAvailable, aiConsent, onReset, signOutAction }: { user: AuthUser; aiAvailable: boolean; aiConsent: boolean; onReset: () => void; signOutAction: () => Promise<void> }) {
  return (
    <div className="account-menu" role="dialog" aria-label="Account menu">
      <div className="account-menu-user">
        <span className="account-menu-avatar">{user.image ? <img src={user.image} alt="" /> : (user.name || user.email || "U")[0]?.toUpperCase()}</span>
        <span><strong>{user.name || "PeachyPawz account"}</strong><small>{user.email || "Signed in with Google"}</small></span>
      </div>
      <div className="account-menu-status">
        <span className={aiConsent && aiAvailable ? "account-status-dot online" : "account-status-dot"} />
        <span><strong>AI assistance</strong><small>{aiConsent && aiAvailable ? "Enabled for this pet" : aiAvailable ? "Off for this pet" : "AI features unavailable"}</small></span>
      </div>
      <div className="account-menu-divider" />
      <button type="button" onClick={onReset}>Reset pet workspace</button>
      <form action={signOutAction}><button type="submit">Sign out</button></form>
    </div>
  );
}

function Onboarding({ user, aiAvailable, onComplete }: { user: AuthUser; aiAvailable: boolean; onComplete: (pet: Pet, consent: boolean, startMode: StartMode) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Pet["species"]>("Dog");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<Pet["sex"]>("Unknown");
  const [consent, setConsent] = useState(aiAvailable);

  const pet: Pet = {
    id: `pet-${Date.now()}`,
    name: name.trim() || "My pet",
    species,
    breed: breed.trim() || "Breed not added",
    birthDate,
    sex,
    color: species === "Dog" ? "#E9A45D" : "#8F9ED8",
  };

  return (
    <main className="onboarding-page">
      <div className="onboarding-ambient" aria-hidden="true">
        <i className="ambient-orb orb-one" /><i className="ambient-orb orb-two" /><i className="ambient-orb orb-three" />
        <span className="ambient-paw paw-one">🐾</span><span className="ambient-paw paw-two">🐾</span><span className="ambient-paw paw-three">🐾</span>
      </div>
      <header className="onboarding-top"><BrandMark /><div className="onboarding-user"><span>{user.image ? <img src={user.image} alt="" /> : (user.name?.[0] || "U")}</span><small>{user.email || user.name}</small></div></header>
      <section className="onboarding-card">
        <div className="step-row"><span className={step >= 1 ? "active" : ""}>1</span><i className={step >= 2 ? "active" : ""} /><span className={step >= 2 ? "active" : ""}>2</span></div>
        <div key={step} className={`onboarding-step-content step-${step}`}>
        {step === 1 ? <>
          <span className="onboarding-kicker">Welcome to PeachyPawz</span>
          <h1>First, tell us about your pet.</h1>
          <p>Just the basics. You can add richer health history from documents or records next.</p>
          <div className="species-switch"><button className={species === "Dog" ? "active" : ""} onClick={() => setSpecies("Dog")}>🐶 Dog</button><button className={species === "Cat" ? "active" : ""} onClick={() => setSpecies("Cat")}>🐱 Cat</button></div>
          <div className="onboarding-form">
            <label><span>Pet name *</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bruno" /></label>
            <label><span>Breed <em>optional</em></span><input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Golden Retriever" /></label>
            <div className="onboarding-form-row"><label><span>Birthday <em>optional</em></span><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></label><label><span>Sex <em>optional</em></span><select value={sex} onChange={(e) => setSex(e.target.value as Pet["sex"])}><option>Unknown</option><option>Male</option><option>Female</option></select></label></div>
          </div>
          <button className="button primary full onboarding-next" disabled={!name.trim()} onClick={() => setStep(2)}>Continue <ArrowRight size={17} /></button>
        </> : <>
          <button className="back-link" onClick={() => setStep(1)}>← Back</button>
          <span className="onboarding-kicker">Build {pet.name}'s timeline</span>
          <h1>How would you like to start?</h1>
          <p>No records are invented. PeachyPawz only learns from what you add, import, or explicitly load as sample data.</p>
          <button className={`ai-consent-card ${consent ? "selected" : ""}`} disabled={!aiAvailable} onClick={() => aiAvailable && setConsent((value) => !value)}>
            <span className="ai-orb"><Bot size={19} /></span><div><strong>Use AI analysis for health records</strong><small>{aiAvailable ? "AI may summarize and extract only the records you submit. You review imports before anything is saved." : "Optional AI is not configured on this deployment. Deterministic timeline analytics still work."}</small></div><i className={consent && aiAvailable ? "on" : ""}><b /></i>
          </button>
          <div className="start-choice-grid">
            <button onClick={() => onComplete(pet, consent, "upload")}><span><Upload size={22} /></span><strong>Upload a health document</strong><small>PDF, image or vet report</small><ChevronRight size={17} /></button>
            <button onClick={() => onComplete(pet, consent, "manual")}><span><Plus size={22} /></span><strong>Add a record manually</strong><small>Weight, activity, symptoms & more</small><ChevronRight size={17} /></button>
            <button onClick={() => onComplete(pet, consent, "empty")}><span>🐾</span><strong>Start with an empty timeline</strong><small>Add records whenever you're ready</small><ChevronRight size={17} /></button>
          </div>
          <div className="demo-separator"><span>Hackathon evaluator?</span></div>
          <button className="demo-load-button" onClick={() => onComplete(pet, consent, "demo")}><Sparkles size={16} /> Explicitly load the synthetic Max demo story</button>
        </>}
        </div>
      </section>
      <p className="onboarding-footnote"><ShieldCheck size={14} /> Signed in with Google · Health data in this prototype is stored locally in this browser.</p>
    </main>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <span className="brand-mark" aria-hidden="true">🐾</span>
      <span><strong>PeachyPawz</strong>{!compact && <small>A clearer story for every paw.</small>}</span>
    </div>
  );
}

function PetSwitcher({ pet, pets, selectedId, onSelect, onAddPet }: { pet: Pet; pets: Pet[]; selectedId: string; onSelect: (id: string) => void; onAddPet: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pet-switcher-wrap">
      <button className="pet-switcher" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="pet-avatar" style={{ background: pet.color }}>{pet.name === "Max" ? "🐶" : pet.name[0]}</span>
        <span><strong>{pet.name}</strong><small>{pet.breed}</small></span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="pet-menu">
          {pets.map((item) => <button key={item.id} className={selectedId === item.id ? "selected" : ""} onClick={() => { onSelect(item.id); setOpen(false); }}><span className="pet-avatar small" style={{ background: item.color }}>{item.name === "Max" ? "🐶" : item.name[0]}</span><span><strong>{item.name}</strong><small>{item.breed}</small></span>{selectedId === item.id && <Check size={16} />}</button>)}
          <button className="pet-menu-add" onClick={() => { setOpen(false); onAddPet(); }}><span className="pet-avatar small add">+</span><span><strong>Add another pet</strong><small>Separate timeline & chat memory</small></span></button>
        </div>
      )}
    </div>
  );
}

function HomeView({ pet, events, analytics, onEvidence, onStory, onVet, onAsk, onTimeline, onAdd, onUpload, onDemo }: any) {
  const weight = metricSeries(events, pet.id, "weight");
  const activity = metricSeries(events, pet.id, "activity");
  const recent = events.slice(0, 4);
  const earliest = events.at(-1)?.date;
  const latest = events[0]?.date;
  const vaccineReminder = events.find((event: HealthEvent) => event.type === "vaccine" && event.date >= todayDate());
  if (events.length < 3) return <EmptyState pet={pet} eventCount={events.length} onAdd={onAdd} onUpload={onUpload} onDemo={onDemo} />;

  const changed = analytics.status === "changes";
  const reliableBaselines = analytics.baselines.filter((item: any) => item.state === "reliable").length;
  const sourceCount = new Set(events.map((event: HealthEvent) => event.source)).size;
  const latestWeight = weight.at(-1)?.value;
  const latestActivity = activity.at(-1)?.value;
  const recordPeriod = earliest && latest ? `${shortDate(earliest)} — ${shortDate(latest)}` : "Starting now";

  return (
    <div className="home-layout">
      <div className="home-main">
        <section className={`home-hero ${changed ? "has-change" : "is-learning"}`}>
          <div className="home-hero-copy">
            <span className={`status-pill ${changed ? "changes" : "stable"}`}><span /> {changed ? "Changes detected" : "Learning baseline"}</span>
            <p className="home-overline">Today with {pet.name}</p>
            <h2>{changed ? `A few things shifted in ${pet.name}'s recent pattern.` : `PeachyPawz is learning what normal looks like for ${pet.name}.`}</h2>
            <p className="home-hero-summary">{analytics.primaryInsight.summary}</p>
            <div className="home-hero-actions">
              <button className="button primary" disabled={!analytics.primaryInsight.evidenceIds.length} onClick={() => onEvidence(analytics.primaryInsight.evidenceIds)}><CircleHelp size={16} /> See the evidence</button>
              <button className="button hero-secondary" onClick={onStory}><Sparkles size={16} /> Read health story</button>
            </div>
            <p className="home-safety"><ShieldCheck size={14} /> Based on {pet.name}'s available records. This is not a diagnosis.</p>
          </div>
          <div className="home-hero-visual" aria-hidden="true">
            <div className="story-orbit orbit-a" />
            <div className="story-orbit orbit-b" />
            <div className="story-core"><span>{pet.species === "Cat" ? "🐱" : "🐶"}</span><strong>{pet.name}</strong><small>Health story</small></div>
            <div className="story-chip chip-weight"><EventIcon type="weight" /><span><small>Weight</small><strong>{latestWeight ? `${latestWeight} kg` : "Tracked"}</strong></span></div>
            <div className="story-chip chip-activity"><EventIcon type="activity" /><span><small>Activity</small><strong>{latestActivity ? `${latestActivity} min` : "Tracked"}</strong></span></div>
            <div className="story-chip chip-evidence"><FileSearch size={15} /><span><small>Evidence</small><strong>{analytics.primaryInsight.evidenceIds.length} linked</strong></span></div>
          </div>
        </section>

        <section className="home-quick-actions" aria-label="Quick actions">
          <button onClick={onAdd}><span><Plus size={18} /></span><div><strong>Add record</strong><small>Weight, symptom, note</small></div><ChevronRight size={16} /></button>
          <button onClick={onUpload}><span><Upload size={18} /></span><div><strong>Import document</strong><small>Review before saving</small></div><ChevronRight size={16} /></button>
          <button onClick={onAsk}><span><MessageCircle size={18} /></span><div><strong>Ask about {pet.name}</strong><small>Grounded in the timeline</small></div><ChevronRight size={16} /></button>
          <button onClick={onVet}><span><Stethoscope size={18} /></span><div><strong>Prepare for Vet</strong><small>Build a factual brief</small></div><ChevronRight size={16} /></button>
        </section>

        <section className="section-block home-section">
          <div className="section-heading"><div><span className="section-kicker"><Sparkles size={15} /> What changed?</span><h2>Changes that stand out from the timeline</h2></div><span className="time-chip">{recordPeriod}</span></div>
          <div className="change-grid home-change-grid">
            {analytics.changes.map((change: any) => (
              <button className="change-card home-change-card" key={change.metric} onClick={() => onEvidence(change.evidenceIds)}>
                <div className={`metric-icon ${change.metric}`}><EventIcon type={change.metric} /></div>
                <div className="change-copy"><span>{change.label}</span><strong>{change.from} <ArrowRight size={14} /> {change.to}</strong><small className={change.direction === "up" ? "up" : change.direction === "down" ? "down" : "neutral"}>{change.changePercent !== undefined ? <>{change.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(change.changePercent).toFixed(1)}%</> : "Recorded state changed"}</small></div>
                <ChevronRight size={17} className="card-chevron" />
              </button>
            ))}
            {analytics.changes.length === 0 && <div className="quiet-card"><strong>More history → better context</strong><p>Add repeat measurements and PeachyPawz will compare new values with this pet's earlier pattern.</p></div>}
          </div>
        </section>

        <section className="home-insight-panel">
          <div className="home-insight-icon"><Bot size={20} /></div>
          <div className="home-insight-body">
            <div className="home-insight-top"><span><small>Peachy Intelligence</small><strong>{analytics.primaryInsight.title}</strong></span><span className="confidence-pill">{analytics.primaryInsight.confidence}</span></div>
            <p>{analytics.primaryInsight.summary}</p>
            {analytics.changes.length >= 2 && <div className="relationship compact">{analytics.changes.map((change: any, index: number) => <span key={change.metric} style={{ display: "contents" }}><span>{change.label} {change.direction === "up" ? "↑" : change.direction === "down" ? "↓" : "changed"}</span>{index < analytics.changes.length - 1 && <ArrowRight size={15} />}</span>)}</div>}
            <div className="home-next-action"><span>Responsible next step</span><strong>{analytics.primaryInsight.responsibleAction}</strong></div>
            <div className="insight-actions"><button className="text-button" disabled={!analytics.primaryInsight.evidenceIds.length} onClick={() => onEvidence(analytics.primaryInsight.evidenceIds)}>Why am I seeing this? <ArrowRight size={15} /></button><button className="text-button" onClick={onStory}>Full story <ArrowRight size={15} /></button></div>
          </div>
        </section>

        <section className="section-block trends-section home-section">
          <div className="section-heading"><div><span className="section-kicker"><Activity size={15} /> Personal baseline</span><h2>Compared with {pet.name}'s own normal</h2></div><span className="baseline-readiness">{reliableBaselines ? `${reliableBaselines}/2 reliable` : "Still learning"}</span></div>
          <div className="trend-grid">
            <MetricTrend title="Weight" series={weight.map((item) => item.value)} value={`${latestWeight ?? "—"} kg`} baseline={analytics.baselines.find((item: any) => item.metric === "weight")} />
            <MetricTrend title="Activity" series={activity.map((item) => item.value)} value={`${latestActivity ?? "—"} min/day`} baseline={analytics.baselines.find((item: any) => item.metric === "activity")} inverse />
          </div>
        </section>

        <section className="section-block home-section">
          <div className="section-heading"><div><span className="section-kicker"><CalendarDays size={15} /> Recent timeline</span><h2>The records behind the story</h2></div><button className="text-button" onClick={onTimeline}>View timeline <ArrowRight size={15} /></button></div>
          <div className="timeline-preview home-timeline">{recent.map((event: HealthEvent) => <TimelineRow key={event.id} event={event} />)}</div>
        </section>
      </div>

      <aside className="home-side">
        <section className="home-side-card pet-overview-card">
          <div className="pet-profile-top"><span className="pet-avatar xl" style={{ background: pet.color }}>{pet.name === "Max" ? "🐶" : pet.name[0]}</span><div><span className="tiny-label">Your pet</span><h3>{pet.name}</h3><p>{pet.breed || pet.species} · {ageLabel(pet.birthDate)}</p></div></div>
          <div className="pet-overview-stats"><span><small>Sex</small><strong>{pet.sex}</strong></span><span><small>Latest weight</small><strong>{latestWeight ? `${latestWeight} kg` : "Not recorded"}</strong></span></div>
        </section>

        <section className="home-side-card continuity-card">
          <div className="side-card-heading"><span className="side-card-icon subtle"><FileSearch size={18} /></span><div><small>Timeline coverage</small><strong>Your story has context</strong></div></div>
          <div className="coverage-grid"><span><strong>{events.length}</strong><small>records</small></span><span><strong>{sourceCount}</strong><small>source{sourceCount === 1 ? "" : "s"}</small></span><span><strong>{reliableBaselines}/2</strong><small>baselines</small></span></div>
          <p>{recordPeriod}</p>
        </section>

        {vaccineReminder ? <section className="home-side-card care-card"><div className="side-card-heading"><span className="side-card-icon subtle"><CalendarDays size={18} /></span><div><small>Upcoming care</small><strong>{vaccineReminder.title}</strong></div></div><p>Due {shortDate(vaccineReminder.date)} · {sourceText(vaccineReminder)}</p><button className="text-button" onClick={onTimeline}>See record <ArrowRight size={15} /></button></section> : <section className="home-side-card care-card"><div className="side-card-heading"><span className="side-card-icon subtle"><CalendarDays size={18} /></span><div><small>Upcoming care</small><strong>No due items recorded</strong></div></div><p>Add vaccinations, follow-ups or medications to keep care dates visible here.</p></section>}

        <section className="home-side-card trust-card"><ShieldCheck size={18} /><div><strong>Explainable by design</strong><p>Insights link back to the records and calculations that produced them.</p></div></section>
      </aside>
    </div>
  );
}

function MetricTrend({ title, series, value, baseline, inverse = false }: any) {
  const latest = series.at(-1);
  const delta = baseline?.average ? ((latest - baseline.average) / baseline.average) * 100 : 0;
  return <article className="metric-trend"><div className="metric-trend-head"><div><span>{title}</span><strong>{value}</strong></div><small className={inverse ? "down" : "up"}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}% vs baseline</small></div><Sparkline values={series} /><div className="baseline-caption"><span><i /> {baseline?.state === "reliable" ? "Personal baseline" : "Emerging baseline"}</span><strong>{baseline?.min}–{baseline?.max} {baseline?.unit}</strong></div><p>{baseline?.explanation}</p></article>;
}

function TimelineView({ pet, events, onAdd, onUpload, onEvent }: { pet: Pet; events: HealthEvent[]; onAdd: () => void; onUpload: () => void; onEvent: (event: HealthEvent) => void }) {
  const [filter, setFilter] = useState<EventType | "all">("all");
  const [query, setQuery] = useState("");
  const visible = events.filter((event) => filter === "all" || event.type === filter).filter((event) => `${event.title} ${event.summary}`.toLowerCase().includes(query.toLowerCase()));
  const groups = visible.reduce<Record<string, HealthEvent[]>>((acc, event) => { const month = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${event.date}T12:00:00`)); (acc[month] ||= []).push(event); return acc; }, {});
  return <div className="page-stack narrow-page"><div className="page-intro"><div><span className="section-kicker"><CalendarDays size={15} /> Source of truth</span><h2>{pet.name}'s health timeline</h2><p>Every insight traces back to reviewed records you added or approved.</p></div><div className="page-actions"><button className="button secondary" onClick={onUpload}><Upload size={16} /> Import</button><button className="button primary" onClick={onAdd}><Plus size={16} /> Add record</button></div></div><div className="timeline-toolbar"><label className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search records" /></label><div className="filter-row">{["all","weight","activity","diet","symptom","vet","medication"].map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item as any)} key={item}>{item === "all" ? "All" : eventLabels[item as EventType]}</button>)}</div></div><div className="full-timeline">{Object.entries(groups).map(([month, monthEvents]) => <section key={month}><h3>{month}</h3>{monthEvents.map((event) => <TimelineRow event={event} key={event.id} detailed onAction={onEvent} />)}</section>)}{visible.length === 0 && <div className="zero-state">No matching records yet. Add one manually or import a health document.</div>}</div></div>;
}

function TimelineRow({ event, detailed = false, onAction }: { event: HealthEvent; detailed?: boolean; onAction?: (event: HealthEvent) => void }) {
  return <article className={`timeline-row ${detailed ? "detailed" : ""}`}><div className={`timeline-icon type-${event.type}`}><EventIcon type={event.type} /></div><div className="timeline-copy"><div className="timeline-title"><strong>{event.title}</strong><span>{shortDate(event.date)}</span></div><p>{event.summary}</p>{detailed && <div className="provenance"><span>{sourceText(event)}</span>{event.confidence && <span>{event.confidence} confidence</span>}<span>{event.reviewStatus === "corrected" ? "Corrected" : "Reviewed"}</span></div>}</div>{detailed && onAction && <button className="icon-button" aria-label={`Edit ${event.title}`} onClick={() => onAction(event)}><MoreHorizontal size={17} /></button>}</article>;
}

function InsightsView({ pet, analytics, events, onEvidence, onStory }: { pet: Pet; analytics: AnalyticsResult; events: HealthEvent[]; onEvidence: (ids: string[]) => void; onStory: () => void }) {
  return <div className="page-stack narrow-page"><div className="page-intro"><div><span className="section-kicker"><Sparkles size={15} /> Explainable intelligence</span><h2>Insights for {pet.name}</h2><p>Ranked by evidence strength, magnitude and persistence — not fear.</p></div></div><section className="insights-feature"><div className="insights-feature-top"><span className="status-pill changes"><span /> Changes detected</span><span className="confidence-pill">{analytics.primaryInsight.confidence}</span></div><h3>{analytics.primaryInsight.title}</h3><p>{analytics.primaryInsight.summary}</p><div className="insight-evidence-summary"><strong>Evidence bundle</strong><span>{analytics.primaryInsight.evidenceIds.length} linked records</span><span>{formatDate(analytics.primaryInsight.timeRange.start)} — {formatDate(analytics.primaryInsight.timeRange.end)}</span></div><button className="button dark" onClick={() => onEvidence(analytics.primaryInsight.evidenceIds)}><FileSearch size={16} /> Inspect evidence</button></section><section className="section-block surface"><div className="section-heading"><div><span className="section-kicker">Baseline deviations</span><h2>What is unusual for {pet.name}?</h2></div></div><div className="baseline-list">{analytics.baselines.map((baseline) => <div key={baseline.metric}><div className={`metric-icon ${baseline.metric}`}><EventIcon type={baseline.metric} /></div><span><strong>{eventLabels[baseline.metric]}</strong><small>{baseline.explanation}</small></span><span className="baseline-range">{baseline.min ?? "—"}–{baseline.max ?? "—"} {baseline.unit}</span></div>)}</div></section><section className="section-block surface story-teaser"><div><span className="section-kicker"><Bot size={15} /> Narrative layer</span><h2>Turn the data into a health story</h2><p>AI receives structured analytics and evidence, then explains the timeline in cautious language.</p></div><button className="button primary" onClick={onStory}>Generate story <Sparkles size={16} /></button></section></div>;
}

type ChatMessage = ChatTurn & { answer?: ChatAnswer & { mode?: string } };

function AskView({ pet, events, allowAI, storageKey }: { pet: Pet; events: HealthEvent[]; allowAI: boolean; storageKey: string }) {
  const greeting = (): ChatMessage => ({
    id: `welcome-${pet.id}`,
    role: "assistant",
    text: `Ask me about ${pet.name}'s timeline. I can remember this conversation and re-check older records or imported documents when you bring them up again.`,
    createdAt: new Date().toISOString(),
  });
  const [messages, setMessages] = useState<ChatMessage[]>([greeting()]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHydrated, setChatHydrated] = useState(false);

  useEffect(() => {
    setChatHydrated(false);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed.slice(-120));
        } else {
          setMessages([greeting()]);
        }
      } else {
        setMessages([greeting()]);
      }
    } catch {
      setMessages([greeting()]);
    }
    setChatHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, pet.id, pet.name]);

  useEffect(() => {
    if (!chatHydrated) return;
    try { localStorage.setItem(storageKey, JSON.stringify(messages.slice(-120))); } catch {}
  }, [chatHydrated, messages, storageKey]);

  const clearChat = () => {
    const first = greeting();
    setMessages([first]);
    try { localStorage.setItem(storageKey, JSON.stringify([first])); } catch {}
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    const userTurn: ChatMessage = { id: `user-${Date.now()}`, role: "user", text: q, createdAt: new Date().toISOString() };
    const historyForRequest: ChatTurn[] = [...messages, userTurn].slice(-120).map(({ id, role, text, createdAt, answer }) => ({
      id,
      role,
      text,
      createdAt,
      scope: answer?.scope,
      evidenceIds: answer?.evidenceIds,
    }));
    setMessages((current) => [...current, userTurn]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat", pet, events, question: q, allowAI, history: historyForRequest }),
      });
      const answer = await res.json();
      const assistantTurn: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: answer.answer || "I couldn't verify that from the available records.",
        answer,
        createdAt: new Date().toISOString(),
        scope: answer.scope,
        evidenceIds: answer.evidenceIds,
      };
      setMessages((current) => [...current, assistantTurn]);
    } catch {
      setMessages((current) => [...current, {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        text: "AI explanation is temporarily unavailable. Your timeline and this chat history are still saved in this browser.",
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const chips = ["Explain all unusual changes", "What did that earlier report say?", "When did activity decline begin?", `How has ${pet.name}'s weight changed?`];
  return <div className="ask-layout"><section className="chat-panel"><div className="chat-header"><span className="ai-orb large"><Bot size={22} /></span><div className="chat-header-copy"><h2>Ask about {pet.name}</h2><p>{allowAI ? "Conversational memory + fresh timeline retrieval" : "Conversation saved · deterministic answers · AI consent off"}</p></div><button className="chat-new-button" onClick={clearChat} disabled={loading} title="Start a new conversation">New chat</button></div><div className="chat-messages">{messages.map((message) => <div className={`chat-message ${message.role}`} key={message.id}>{message.role === "assistant" && <span className="chat-avatar"><Bot size={16} /></span>}<div className="bubble">{message.answer && message.answer.scope !== "conversation" && <span className={`scope-badge ${message.answer.scope}`}>{message.answer.scope === "pet-records" ? `Based on ${pet.name}'s records` : "General information"}</span>}<p>{message.text}</p>{message.answer && message.answer.scope !== "conversation" && <small>{message.answer.evidenceIds?.length ? `${message.answer.evidenceIds.length} evidence record${message.answer.evidenceIds.length > 1 ? "s" : ""} linked` : "No record citation needed"}{message.answer.memory?.recalledTurns ? ` · recalled ${message.answer.memory.recalledTurns} older chat turn${message.answer.memory.recalledTurns > 1 ? "s" : ""}` : ""}{message.answer.memory?.retrievedRecords ? ` · checked ${message.answer.memory.retrievedRecords} timeline record${message.answer.memory.retrievedRecords > 1 ? "s" : ""}` : ""}</small>}</div></div>)}{loading && <div className="chat-message assistant"><span className="chat-avatar"><Bot size={16} /></span><div className="bubble typing"><i/><i/><i/></div></div>}</div><div className="prompt-chips">{chips.map((chip) => <button onClick={() => send(chip)} key={chip}>{chip}</button>)}</div><form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(question); }}><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={`Ask naturally — “what about before that?”…`} /><button disabled={!question.trim() || loading}><ArrowUpRight size={18} /></button></form></section><aside className="chat-trust"><ShieldCheck size={22} /><h3>Memory without making things up</h3><ul><li>Recent turns keep normal follow-ups coherent.</li><li>Older turns are retrieved when their topic becomes relevant again.</li><li>Uploaded document memory stays attached to {pet.name}'s timeline.</li><li>Conversation context can resolve references, but it is never treated as medical evidence.</li><li>Every pet-specific claim is re-checked against current records.</li></ul></aside></div>;
}

function EmptyState({ pet, eventCount, onAdd, onUpload, onDemo }: { pet: Pet; eventCount: number; onAdd: () => void; onUpload: () => void; onDemo: () => void }) {
  return <div className="empty-state"><span className="empty-paw">🐾</span><h2>{eventCount ? `Keep building ${pet.name}'s health story` : `Start ${pet.name}'s health story`}</h2><p>{eventCount ? `You have ${eventCount} record${eventCount === 1 ? "" : "s"}. PeachyPawz needs a little more history before it can establish a useful personal baseline.` : "No health records yet. Nothing is pre-filled or assumed about your pet."}</p><div className="empty-actions"><button className="button primary" onClick={onAdd}><Plus size={16} /> Add record</button><button className="button secondary" onClick={onUpload}><Upload size={16} /> Upload document</button></div><small>As the timeline grows, PeachyPawz learns this pet's normal patterns.</small><button className="empty-demo-link" onClick={onDemo}>Evaluator? Load clearly labeled synthetic demo data</button></div>;
}

function EvidenceDrawer({ pet, insight, evidence, onClose }: any) {
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><aside className="drawer"><div className="drawer-head"><div><span className="section-kicker"><FileSearch size={15} /> Explainability</span><h2>Why am I seeing this?</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><p className="drawer-lead">This insight is based only on reviewed records from {pet.name}'s timeline.</p><div className="evidence-stats"><span><strong>{evidence.length}</strong><small>Linked records</small></span><span><strong>{insight.confidence.replace(" confidence", "")}</strong><small>Evidence confidence</small></span></div><div className="calculation-card"><strong>Deterministic analysis</strong><p>{insight.summary}</p><p>Dates, percentages, event ordering and baseline calculations are computed in code before any optional AI narration.</p></div><div className="evidence-list"><h3>Evidence</h3>{evidence.map((event: HealthEvent) => <TimelineRow event={event} detailed key={event.id} />)}</div><div className="safety-card"><ShieldCheck size={18} /><p><strong>What this does not mean</strong>Temporal overlap is not proven causation, and an insight is not a veterinary diagnosis.</p></div></aside></div>;
}

function StoryModal({ pet, events, allowAI, onClose }: { pet: Pet; events: HealthEvent[]; allowAI: boolean; onClose: () => void }) {
  const [story, setStory] = useState<any>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "story", pet, events, allowAI }) }).then((r) => r.json()).then((data) => active && setStory(data)).catch(() => active && setStory({ error: true })).finally(() => active && setLoading(false)); return () => { active = false; }; }, [pet, events, allowAI]);
  return <div className="overlay centered"><section className="modal story-modal"><div className="modal-head"><span className="ai-orb"><Bot size={19} /></span><div><small>Health Story</small><h2>{pet.name}'s available history</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>{loading ? <LoadingBlock label="Building the story from evidence…" /> : story?.error ? <ErrorBlock /> : <><div className="story-mode"><ShieldCheck size={15} /> {story.mode === "llm" ? "AI narrative grounded in timeline evidence" : "Deterministic narrative — no health facts invented"}</div><div className="story-body">{story.paragraphs?.map((paragraph: string, index: number) => <div className="story-chapter" key={index}><span>{String(index + 1).padStart(2, "0")}</span><p>{paragraph}</p></div>)}</div><div className="responsible-action"><Stethoscope size={19} /><div><strong>Responsible next action</strong><p>{story.action}</p></div></div><p className="story-disclaimer">PeachyPawz summarizes records and patterns. It does not diagnose conditions or replace a veterinarian.</p></>}</section></div>;
}

function VetBriefModal({ pet, events, onClose }: { pet: Pet; events: HealthEvent[]; onClose: () => void }) {
  const [brief, setBrief] = useState<any>(null);
  const [windowDays, setWindowDays] = useState<30 | 60 | 90>(90);
  useEffect(() => { setBrief(null); fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "vet", pet, events, windowDays }) }).then((r) => r.json()).then(setBrief); }, [pet, events, windowDays]);
  return <div className="overlay centered"><section className="modal vet-modal"><div className="modal-head"><span className="modal-icon mint"><Stethoscope size={20} /></span><div><small>Prepare for Vet</small><h2>{pet.name}'s {windowDays}-day brief</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><div className="vet-window-switch" aria-label="Vet brief time range">{([30,60,90] as const).map((days) => <button key={days} className={windowDays === days ? "active" : ""} onClick={() => setWindowDays(days)}>{days} days</button>)}</div>{!brief ? <LoadingBlock label="Preparing factual timeline brief…" /> : <div className="vet-brief"><div className="brief-block"><h3>Recent changes</h3>{brief.recentChanges?.map((item: any) => <div className="brief-row" key={item.metric}><span>{item.label}</span><strong>{item.from} → {item.to}</strong>{item.changePercent !== undefined && <em>{item.changePercent > 0 ? "+" : ""}{item.changePercent.toFixed(1)}%</em>}</div>)}</div><div className="brief-block"><h3>Pattern to discuss</h3><p>{brief.pattern}</p></div><div className="brief-block"><h3>Suggested questions</h3><ol>{brief.questions?.map((question: string) => <li key={question}>{question}</li>)}</ol></div><div className="brief-source"><FileText size={17} /><p><strong>Traceable to records</strong>{brief.symptoms?.length || 0} symptom observations · {brief.visits?.length || 0} vet visit · {brief.medications?.length || 0} medication event</p></div><p className="story-disclaimer">{brief.disclaimer}</p></div>}</section></div>;
}

function AddEventSheet({ pet, onAdd, onClose, onUpload }: { pet: Pet; onAdd: (event: HealthEvent) => void; onClose: () => void; onUpload: () => void }) {
  const [type, setType] = useState<EventType>("weight"); const [value, setValue] = useState(""); const [date, setDate] = useState(todayDate());
  const submit = (e: FormEvent) => { e.preventDefault(); if (!value.trim()) return; const numeric = Number(value); const isNumeric = type === "weight" || type === "activity"; onAdd({ id: `manual-${Date.now()}`, petId: pet.id, type, date, title: `${eventLabels[type]} recorded`, summary: isNumeric ? `${numeric} ${type === "weight" ? "kg" : "min/day"}` : value, data: isNumeric ? { value: numeric, unit: type === "weight" ? "kg" : "min/day" } : type === "appetite" ? { state: value } : { note: value }, source: "manual", reviewStatus: "approved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); onClose(); };
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><aside className="drawer form-drawer"><div className="drawer-head"><div><span className="section-kicker"><Plus size={15} /> Manual entry</span><h2>Add to {pet.name}'s timeline</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><div className="event-type-grid">{(["weight","activity","appetite","symptom","medication","vet","note"] as EventType[]).map((item) => <button className={type === item ? "active" : ""} onClick={() => setType(item)} key={item}><EventIcon type={item} /><span>{eventLabels[item]}</span></button>)}</div><form className="record-form" onSubmit={submit}><label><span>Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label><span>{type === "weight" ? "Weight (kg)" : type === "activity" ? "Minutes per day" : eventLabels[type]}</span>{type === "appetite" ? <select value={value} onChange={(e) => setValue(e.target.value)}><option value="">Select</option><option>Normal</option><option>Reduced</option><option>Increased</option></select> : <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "weight" ? "e.g. 19.2" : type === "activity" ? "e.g. 68" : "Record what happened…"} />}</label><div className="form-note"><Info size={15} /> Missing data stays missing. PeachyPawz never treats “no record” as “normal.”</div><button className="button primary full" disabled={!value.trim()}>Save reviewed record</button></form><div className="drawer-divider"><span>or</span></div><button className="upload-callout" onClick={onUpload}><Upload size={20} /><span><strong>Import a document</strong><small>PDF, JPG or PNG · review before timeline</small></span><ChevronRight size={17} /></button></aside></div>;
}

function UploadSheet({ pet, existingEvents, allowAI, initialFile = null, onAdd, onClose }: { pet: Pet; existingEvents: HealthEvent[]; allowAI: boolean; initialFile?: File | null; onAdd: (event: HealthEvent) => void; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(initialFile); const [result, setResult] = useState<any>(null); const [loading, setLoading] = useState(false); const [date, setDate] = useState(todayDate()); const [weight, setWeight] = useState(""); const [fileHash, setFileHash] = useState("");
  const extract = async () => { if (!file) return; setLoading(true); let hash = fileHash; try { const bytes = await file.arrayBuffer(); const digest = await crypto.subtle.digest("SHA-256", bytes); hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); setFileHash(hash); } catch {} const form = new FormData(); form.set("file", file); form.set("allowAI", String(allowAI)); try { const res = await fetch("/api/documents/extract", { method: "POST", body: form }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setResult(data); setDate(data.extraction.date || todayDate()); setWeight(data.extraction.weight?.value?.toString() || ""); } catch (error) { setResult({ error: error instanceof Error ? error.message : "Extraction failed" }); } finally { setLoading(false); } };
  const approve = () => {
    if (!result?.extraction) return;
    const extraction = result.extraction;
    const stamp = Date.now();
    const documentId = `doc-${stamp}`;
    const createdAt = new Date().toISOString();
    const documentMemory = String(result.documentText || extraction.notes || extraction.followUp || "").slice(0, 8000);

    onAdd({
      id: `doc-memory-${stamp}`,
      petId: pet.id,
      type: "document",
      date,
      title: result.filename || "Imported health document",
      summary: extraction.notes || extraction.followUp || `Reviewed document imported for ${pet.name}`,
      data: {
        filename: result.filename || "health-document",
        documentType: extraction.documentType || "unknown",
        extractedText: documentMemory,
        clinic: extraction.clinic || "",
        followUp: extraction.followUp || "",
        medicationText: extraction.medications?.map((m: any) => [m.name, m.dose, m.frequency].filter(Boolean).join(" ")).join("; ") || "",
        fileHash,
      },
      source: "document_ai",
      sourceLabel: result.filename,
      sourceDocumentId: documentId,
      confidence: extraction.confidence,
      reviewStatus: "approved",
      createdAt,
      updatedAt: createdAt,
    });

    if (weight) onAdd({
      id: `doc-weight-${stamp}`,
      petId: pet.id,
      type: "weight",
      date,
      title: "Weight imported",
      summary: `${weight} ${extraction.weight?.unit || "kg"}`,
      data: { value: Number(weight), unit: extraction.weight?.unit || "kg" },
      source: "document_ai",
      sourceLabel: result.filename,
      sourceDocumentId: documentId,
      confidence: extraction.confidence,
      reviewStatus: "approved",
      createdAt,
      updatedAt: createdAt,
    });

    onAdd({
      id: `doc-visit-${stamp}`,
      petId: pet.id,
      type: extraction.documentType === "vaccination" ? "vaccine" : "vet",
      date,
      title: extraction.documentType === "vaccination" ? "Vaccination imported" : "Vet visit imported",
      summary: extraction.followUp || extraction.notes || `Imported from ${result.filename}`,
      data: { clinic: extraction.clinic || "Unknown", followUp: extraction.followUp || null },
      source: "document_ai",
      sourceLabel: result.filename,
      sourceDocumentId: documentId,
      confidence: extraction.confidence,
      reviewStatus: "approved",
      createdAt,
      updatedAt: createdAt,
    });
    onClose();
  };
  const detectedName = result?.extraction?.petName?.trim();
  const nameMismatch = detectedName && detectedName.toLowerCase() !== pet.name.toLowerCase();
  const duplicate = Boolean(fileHash && existingEvents.some((event) => event.type === "document" && event.data.fileHash === fileHash));
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><aside className="drawer form-drawer"><div className="drawer-head"><div><span className="section-kicker"><Upload size={15} /> Document intelligence</span><h2>Import a health record</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>{!result?.extraction ? <><label className="drop-zone"><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setFileHash(""); }} /><span className="drop-icon"><FileText size={23} /></span><strong>{file ? file.name : "Choose a veterinary document"}</strong><p>PDF, JPG, PNG, WebP or TXT · max 8 MB</p><small>Nothing enters {pet.name}'s timeline until you review and approve it.</small></label>{result?.error && <div className="error-banner">{result.error}</div>}<button className="button primary full" onClick={extract} disabled={!file || loading}>{loading ? "Extracting…" : "Extract for review"}</button><div className="sample-tip"><FileSearch size={16} /><p>{allowAI ? "AI analysis is enabled for this import with your onboarding consent. PDF text still uses deterministic parsing where possible." : "AI analysis is off. Text-based PDF/TXT extraction still works; image files will require manual review."}</p></div></> : <div className="review-panel"><div className="review-banner"><ShieldCheck size={18} /><span><strong>Proposed fields — review required</strong><small>{result.extraction.confidence} confidence · {result.filename}</small></span></div>{result.extraction.warnings?.map((warning: string) => <div className="warning-line" key={warning}><Info size={15} /> {warning}</div>)}{nameMismatch && <div className="error-banner"><strong>Wrong-pet check:</strong> this document appears to mention “{detectedName}”, but you are importing into {pet.name}. Verify before approving.</div>}{duplicate && <div className="warning-line"><Info size={15} /> This exact file appears to have already been imported for {pet.name}. Review before creating a duplicate.</div>}<label><span>Assign to pet</span><select value={pet.name} disabled><option>{pet.name}</option></select><small>The destination pet is explicit. PeachyPawz never silently reassigns a health record.</small></label><label><span>Visit date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label><span>Weight</span><div className="input-with-unit"><input value={weight} onChange={(e) => setWeight(e.target.value)} /><span>{result.extraction.weight?.unit || "kg"}</span></div></label><label><span>Clinic</span><input value={result.extraction.clinic || ""} readOnly /></label><label><span>Extracted note</span><textarea value={result.extraction.followUp || result.extraction.notes || ""} readOnly /></label><button className="button primary full" onClick={approve}><Check size={17} /> Approve & add to {pet.name}'s timeline</button><button className="button secondary full" onClick={() => setResult(null)}>Choose a different file</button></div>}</aside></div>;
}


function MobileShareSheet({ share, pet, onUseText, onUseFile, onClose }: { share: PeachySharePayload; pet: Pet; onUseText: () => void; onUseFile: (file: File) => void; onClose: () => void }) {
  const hasText = Boolean(share.text.trim() || share.url.trim());
  return <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="drawer form-drawer mobile-share-drawer">
      <div className="drawer-head"><div><span className="section-kicker"><Upload size={15} /> Peachy Share</span><h2>Shared to PeachyPawz</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>
      <div className="share-hero"><span className="share-hero-icon">🐾</span><span><strong>{share.title || "Health information from your phone"}</strong><small>Review before anything enters {pet.name}'s timeline.</small></span></div>
      {share.url && <div className="web-capture-source"><span className="web-source-icon">↗</span><span><strong>Shared link</strong><small>{share.url}</small></span></div>}
      {share.text && <div className="captured-selection"><strong>Shared text</strong><p>{share.text.slice(0, 1200)}</p></div>}
      {share.loadedFiles.length > 0 && <div className="share-file-list">{share.loadedFiles.map((file, index) => <button type="button" key={`${file.name}-${index}`} onClick={() => onUseFile(file)}><FileText size={19} /><span><strong>{file.name}</strong><small>{file.type || "Shared file"} · {(file.size / 1024 / 1024).toFixed(1)} MB</small></span><ChevronRight size={17} /></button>)}</div>}
      {hasText && <button className="button primary full" onClick={onUseText}><MessageCircle size={17} /> Ask or review shared text</button>}
      {!hasText && share.loadedFiles.length === 0 && <div className="error-banner">No supported text, image or PDF was received. Try sharing the visible text, a screenshot, or the health PDF.</div>}
      <div className="form-note"><ShieldCheck size={15} /> Peachy Share is user-triggered. Shared content is staged for review and is not silently added to the health timeline.</div>
      <button className="button secondary full" onClick={onClose}>Discard shared content</button>
    </aside>
  </div>;
}


function WebCaptureSheet({ capture, pet, existingEvents, allowAI, onAddMany, onClose }: { capture: WebCapture; pet: Pet; existingEvents: HealthEvent[]; allowAI: boolean; onAddMany: (events: HealthEvent[]) => void; onClose: () => void }) {
  const [mode, setMode] = useState<"choose" | "ask" | "review">(capture.mode === "ask" ? "ask" : "choose");
  const [question, setQuestion] = useState(capture.selectedText ? "What does this selected information say?" : "Summarize the pet-health information visible on this page.");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [date, setDate] = useState(todayDate());
  const [weight, setWeight] = useState("");

  const host = (() => { try { return new URL(capture.url).hostname; } catch { return "shared content"; } })();
  const fromMobileShare = capture.origin === "mobile-share";
  const detectedName = result?.extraction?.petName as string | null | undefined;
  const nameMismatch = Boolean(detectedName && detectedName.toLowerCase() !== pet.name.toLowerCase());
  const duplicate = Boolean(result?.fingerprint && existingEvents.some((event) => event.data.captureFingerprint === result.fingerprint));

  const askPage = async (formEvent?: FormEvent) => {
    formEvent?.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const response = await fetch("/api/web-capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "ask", capture, question, allowAI }) });
      const data = await response.json();
      setAnswer(response.ok ? data.answer : data.error || "The captured page could not be analyzed.");
    } catch {
      setAnswer("The captured page could not be analyzed right now.");
    } finally { setLoading(false); }
  };

  const analyzePage = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/web-capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "analyze", capture, allowAI }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
      setDate(data.extraction?.date || todayDate());
      setWeight(data.extraction?.weight?.value != null ? String(data.extraction.weight.value) : "");
      setMode("review");
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "The captured page could not be analyzed.");
      setMode("ask");
    } finally { setLoading(false); }
  };

  const approve = () => {
    if (!result?.extraction || duplicate) return;
    const now = new Date().toISOString();
    const sourceDocumentId = `web-${String(result.fingerprint).slice(0, 16)}`;
    const confidence = result.extraction.confidence || "limited";
    const pageText = (capture.selectedText || capture.text).slice(0, 8000);
    const common = {
      petId: pet.id,
      source: "imported" as const,
      sourceLabel: `${fromMobileShare ? "Peachy Share" : "Web capture"} · ${host}`,
      sourceDocumentId,
      confidence,
      reviewStatus: "approved" as const,
      createdAt: now,
      updatedAt: now,
    };
    const imported: HealthEvent[] = [{
      ...common,
      id: `web-document-${Date.now()}`,
      type: "document",
      date,
      title: `Web record · ${capture.title}`,
      summary: result.extraction.notes || result.extraction.followUp || `Reviewed information captured from ${host}.`,
      data: { pageTitle: capture.title, sourceUrl: capture.url, capturedText: pageText, captureFingerprint: result.fingerprint, extractionMode: result.mode },
    }];

    const weightValue = Number(weight);
    if (weight && Number.isFinite(weightValue) && weightValue > 0) imported.push({
      ...common,
      id: `web-weight-${Date.now()}`,
      type: "weight",
      date,
      title: "Weight",
      summary: `${weightValue} ${result.extraction.weight?.unit || "kg"}`,
      data: { value: weightValue, unit: result.extraction.weight?.unit || "kg", captureFingerprint: result.fingerprint },
    });

    (result.extraction.medications || []).forEach((medication: any, index: number) => imported.push({
      ...common,
      id: `web-medication-${Date.now()}-${index}`,
      type: "medication",
      date,
      title: medication.name || "Medication",
      summary: [medication.name, medication.dose, medication.frequency].filter(Boolean).join(" · ") || "Medication extracted from reviewed web record",
      data: { name: medication.name || "Medication", dose: medication.dose || null, frequency: medication.frequency || null, captureFingerprint: result.fingerprint },
    }));

    if (result.extraction.documentType === "vet_visit") imported.push({
      ...common,
      id: `web-vet-${Date.now()}`,
      type: "vet",
      date,
      title: result.extraction.clinic ? `Vet visit · ${result.extraction.clinic}` : "Imported vet visit",
      summary: result.extraction.notes || result.extraction.followUp || "Reviewed vet information captured from a webpage.",
      data: { clinic: result.extraction.clinic || null, followUp: result.extraction.followUp || null, captureFingerprint: result.fingerprint },
    });

    if (result.extraction.documentType === "vaccination") imported.push({
      ...common,
      id: `web-vaccine-${Date.now()}`,
      type: "vaccine",
      date,
      title: "Imported vaccination record",
      summary: result.extraction.notes || "Reviewed vaccination information captured from a webpage.",
      data: { note: result.extraction.notes || null, captureFingerprint: result.fingerprint },
    });

    if (result.extraction.documentType === "lab") imported.push({
      ...common,
      id: `web-lab-${Date.now()}`,
      type: "lab",
      date,
      title: "Imported lab record",
      summary: result.extraction.notes || "Reviewed lab information captured from a webpage.",
      data: { note: result.extraction.notes || null, captureFingerprint: result.fingerprint },
    });

    onAddMany(imported);
    onClose();
  };

  return <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="drawer form-drawer web-capture-drawer"><div className="drawer-head"><div><span className="section-kicker"><FileSearch size={15} /> {fromMobileShare ? "Peachy Share" : "Ask Peachy extension"}</span><h2>{fromMobileShare ? "Shared from your phone" : "Captured from the web"}</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><div className="web-capture-source"><span className="web-source-icon">↗</span><span><strong>{capture.title}</strong><small>{host}</small></span></div><div className="form-note"><ShieldCheck size={15} /> {fromMobileShare ? "PeachyPawz received only the content you explicitly shared from your phone." : "PeachyPawz received only visible text after you clicked the extension."} This capture is not part of {pet.name}'s timeline until you approve it.</div>{capture.selectedText && <div className="captured-selection"><strong>Selected text</strong><p>{capture.selectedText.slice(0, 700)}</p></div>}<details className="web-capture-preview"><summary>Preview captured visible text</summary><pre>{(capture.selectedText || capture.text).slice(0, 2200)}</pre></details>{mode === "choose" && <div className="web-capture-actions"><button className="button dark full" onClick={() => setMode("ask")}><MessageCircle size={17} /> Ask about this page</button><button className="button primary full" onClick={analyzePage} disabled={loading}><Upload size={17} /> {loading ? "Analyzing…" : "Analyze for timeline import"}</button><button className="button secondary full" onClick={onClose}>Not now</button></div>}{mode === "ask" && <><form className="record-form web-ask-form" onSubmit={askPage}><label><span>Ask about the captured page</span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="e.g. What medication and follow-up does this page mention?" /></label><button className="button dark full" disabled={loading || !question.trim()}><MessageCircle size={17} /> {loading ? "Reading page…" : "Ask Peachy"}</button></form>{answer && <div className="web-answer"><span className="scope-badge general">Captured page</span><p>{answer}</p></div>}<div className="web-capture-actions"><button className="button primary full" onClick={analyzePage} disabled={loading}><Upload size={17} /> Analyze & review for timeline</button><button className="button secondary full" onClick={onClose}>Close capture</button></div></>}{mode === "review" && result?.extraction && <div className="review-panel"><div className="review-banner"><ShieldCheck size={18} /><span><strong>Proposed fields — review required</strong><small>{result.extraction.confidence} confidence · {result.mode === "ai" ? "AI-assisted" : "deterministic extraction"}</small></span></div>{result.extraction.warnings?.map((warning: string) => <div className="warning-line" key={warning}><Info size={15} /> {warning}</div>)}{nameMismatch && <div className="error-banner"><strong>Wrong-pet check:</strong> this page appears to mention “{detectedName}”, but the selected timeline belongs to {pet.name}. Verify before importing.</div>}{duplicate && <div className="error-banner"><strong>Duplicate capture:</strong> this exact page content was already approved for {pet.name}. PeachyPawz will not import it twice.</div>}<label><span>Assign to pet</span><select value={pet.name} disabled><option>{pet.name}</option></select></label><label><span>Record date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label><span>Weight</span><div className="input-with-unit"><input inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} /><span>{result.extraction.weight?.unit || "kg"}</span></div></label><label><span>Clinic</span><input value={result.extraction.clinic || ""} readOnly /></label><label><span>Extracted note</span><textarea value={result.extraction.followUp || result.extraction.notes || ""} readOnly /></label><button className="button primary full" onClick={approve} disabled={duplicate || nameMismatch}><Check size={17} /> Approve & add to {pet.name}'s timeline</button>{nameMismatch && <small className="web-review-help">Switch to the correct pet before importing rather than forcing a mismatched record.</small>}<button className="button secondary full" onClick={() => setMode("ask")}><MessageCircle size={16} /> Ask about page instead</button></div>}<div className="web-capture-footer"><span>Source URL retained for provenance</span><button type="button" onClick={() => window.open(capture.url, "_blank", "noopener,noreferrer")}>Open source ↗</button></div></aside></div>;
}


function AddPetSheet({ onAdd, onClose }: { onAdd: (pet: Pet) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Pet["species"]>("Dog");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<Pet["sex"]>("Unknown");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: `pet-${Date.now()}`,
      name: name.trim(),
      species,
      breed: breed.trim() || "Breed not added",
      birthDate,
      sex,
      color: species === "Dog" ? "#E9A45D" : "#8F9ED8",
    });
  };
  return <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="drawer form-drawer"><div className="drawer-head"><div><span className="section-kicker"><Plus size={15} /> Multi-pet household</span><h2>Add another pet</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><p className="drawer-lead">Each pet gets a separate timeline, analytics baseline and conversation memory.</p><div className="species-switch"><button type="button" className={species === "Dog" ? "active" : ""} onClick={() => setSpecies("Dog")}>🐶 Dog</button><button type="button" className={species === "Cat" ? "active" : ""} onClick={() => setSpecies("Cat")}>🐱 Cat</button></div><form className="record-form" onSubmit={submit}><label><span>Pet name *</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Luna" /></label><label><span>Breed <em>optional</em></span><input value={breed} onChange={(event) => setBreed(event.target.value)} placeholder="e.g. Indie" /></label><label><span>Birthday <em>optional</em></span><input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label><label><span>Sex</span><select value={sex} onChange={(event) => setSex(event.target.value as Pet["sex"])}><option>Unknown</option><option>Male</option><option>Female</option></select></label><button className="button primary full" disabled={!name.trim()}>Create separate pet timeline</button></form></aside></div>;
}

function RecordEditorSheet({ event, onSave, onDelete, onClose }: { event: HealthEvent; onSave: (event: HealthEvent) => void; onDelete: (eventId: string) => void; onClose: () => void }) {
  const numeric = event.type === "weight" || event.type === "activity";
  const [date, setDate] = useState(event.date);
  const initialValue = numeric ? String(event.data.value ?? "") : event.type === "appetite" ? String(event.data.state ?? "") : String(event.data.note ?? event.summary ?? "");
  const [value, setValue] = useState(initialValue);
  const save = (formEvent: FormEvent) => {
    formEvent.preventDefault();
    if (!value.trim()) return;
    const next = { ...event, date };
    if (numeric) {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0) return;
      next.data = { ...event.data, value: number };
      next.summary = `${number} ${String(event.data.unit || (event.type === "weight" ? "kg" : "min/day"))}`;
    } else if (event.type === "appetite") {
      next.data = { ...event.data, state: value };
      next.summary = value;
    } else {
      next.data = { ...event.data, note: value };
      next.summary = value;
    }
    onSave(next);
  };
  return <div className="overlay" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose(); }}><aside className="drawer form-drawer"><div className="drawer-head"><div><span className="section-kicker"><Pencil size={15} /> Data correction</span><h2>Correct timeline record</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><div className="review-banner"><ShieldCheck size={18} /><span><strong>{event.title}</strong><small>{sourceText(event)} · corrections recalculate insights immediately</small></span></div><form className="record-form" onSubmit={save}><label><span>Date</span><input type="date" value={date} onChange={(changeEvent) => setDate(changeEvent.target.value)} /></label><label><span>{event.type === "weight" ? `Weight (${String(event.data.unit || "kg")})` : event.type === "activity" ? "Activity (min/day)" : eventLabels[event.type]}</span>{event.type === "appetite" ? <select value={value} onChange={(changeEvent) => setValue(changeEvent.target.value)}><option>Normal</option><option>Reduced</option><option>Increased</option></select> : numeric ? <input inputMode="decimal" value={value} onChange={(changeEvent) => setValue(changeEvent.target.value)} /> : <textarea value={value} onChange={(changeEvent) => setValue(changeEvent.target.value)} />}</label><div className="form-note"><Info size={15} /> PeachyPawz marks corrected records and recomputes baselines, changes and evidence from the updated timeline.</div><button className="button primary full"><Check size={17} /> Save correction</button><button type="button" className="button danger full" onClick={() => { if (window.confirm("Delete this health record? This also removes it from future analytics and evidence.")) onDelete(event.id); }}><Trash2 size={17} /> Delete record</button></form></aside></div>;
}

function LoadingBlock({ label }: { label: string }) { return <div className="loading-block"><span className="spinner" /><p>{label}</p></div>; }
function ErrorBlock() { return <div className="error-block"><Info size={20} /><h3>AI narrative unavailable</h3><p>Your records and deterministic analytics still work. Try again or continue using the timeline.</p></div>; }

