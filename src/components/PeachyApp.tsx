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
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
  X,
} from "lucide-react";
import { analyzePet, evidenceFor, metricSeries } from "@/lib/analytics";
import { pets as demoPets, seedEvents as demoEvents } from "@/lib/seed";
import { AnalyticsResult, ChatAnswer, EventType, HealthEvent, Pet } from "@/lib/types";
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
  const loadDemo = () => {
    setUserPets(demoPets);
    setEvents(demoEvents);
    setSelectedPetId("max");
    setView("home");
  };
  const resetProfile = () => {
    try { localStorage.removeItem(storageKey); } catch {}
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
        <div className="ai-setting"><span className={aiConsent && aiAvailable ? "online" : ""} /><div><strong>AI analysis</strong><small>{aiConsent && aiAvailable ? "Enabled with consent" : aiAvailable ? "Off for this pet" : "Server key not configured"}</small></div></div>
        <button className="ghost-link" onClick={resetProfile}>Start over / clear local data</button>
        <form action={signOutAction}><button className="ghost-link" type="submit">Sign out</button></form>
        <p className="sidebar-footnote">Signed in as {user.email || user.name || "Google user"}</p>
      </aside>

      <main className="main-shell">
        <header className="mobile-header">
          <BrandMark compact />
          <button className="icon-button" aria-label="Menu"><Menu size={21} /></button>
        </header>

        <div className="topbar">
          <div>
            <p className="eyebrow">Health intelligence timeline</p>
            <h1>{view === "home" ? `${pet.name}'s health story` : navItems.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <PetSwitcher pet={pet} pets={userPets} selectedId={selectedPetId} onSelect={setSelectedPetId} />
            <button className="button secondary desktop-only" onClick={() => setUploadOpen(true)}><Upload size={17} /> Import record</button>
            <button className="button primary desktop-only" onClick={() => setAddOpen(true)}><Plus size={17} /> Add record</button>
          </div>
        </div>

        <section className="content-wrap">
          {view === "home" && (
            <HomeView pet={pet} events={petEvents} analytics={analytics} onEvidence={setEvidenceIds} onStory={() => setStoryOpen(true)} onVet={() => setVetOpen(true)} onAsk={() => setView("ask")} onAdd={() => setAddOpen(true)} onUpload={() => setUploadOpen(true)} onDemo={loadDemo} />
          )}
          {view === "timeline" && <TimelineView pet={pet} events={petEvents} onAdd={() => setAddOpen(true)} onUpload={() => setUploadOpen(true)} />}
          {view === "insights" && <InsightsView pet={pet} analytics={analytics} events={petEvents} onEvidence={setEvidenceIds} onStory={() => setStoryOpen(true)} />}
          {view === "ask" && <AskView pet={pet} events={petEvents} allowAI={aiConsent && aiAvailable} />}
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
      {uploadOpen && <UploadSheet pet={pet} allowAI={aiConsent && aiAvailable} onAdd={addEvent} onClose={() => setUploadOpen(false)} />}
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
      <span className="brand-mark" aria-hidden="true">P</span>
      <span><strong>PeachyPawz</strong>{!compact && <small>A clearer story for every paw.</small>}</span>
    </div>
  );
}

function PetSwitcher({ pet, pets, selectedId, onSelect }: { pet: Pet; pets: Pet[]; selectedId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pet-switcher-wrap">
      <button className="pet-switcher" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="pet-avatar" style={{ background: pet.color }}>{pet.name[0]}</span>
        <span><strong>{pet.name}</strong><small>{pet.breed}</small></span>
        {pets.length > 1 && <ChevronDown size={16} />}
      </button>
      {open && pets.length > 1 && (
        <div className="pet-menu">
          {pets.map((item) => <button key={item.id} className={selectedId === item.id ? "selected" : ""} onClick={() => { onSelect(item.id); setOpen(false); }}><span className="pet-avatar small" style={{ background: item.color }}>{item.name[0]}</span><span><strong>{item.name}</strong><small>{item.breed}</small></span>{selectedId === item.id && <Check size={16} />}</button>)}
        </div>
      )}
    </div>
  );
}

function HomeView({ pet, events, analytics, onEvidence, onStory, onVet, onAsk, onAdd, onUpload, onDemo }: any) {
  const weight = metricSeries(events, pet.id, "weight");
  const activity = metricSeries(events, pet.id, "activity");
  const recent = events.slice(0, 4);
  const earliest = events.at(-1)?.date;
  const latest = events[0]?.date;
  const vaccineReminder = events.find((event: HealthEvent) => event.type === "vaccine" && event.date >= todayDate());
  if (events.length < 3) return <EmptyState pet={pet} eventCount={events.length} onAdd={onAdd} onUpload={onUpload} onDemo={onDemo} />;

  const changed = analytics.status === "changes";
  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <section className="status-card">
          <div className="status-row">
            <div>
              <span className={`status-pill ${changed ? "changes" : "stable"}`}><span /> {changed ? "Changes detected" : "Building context"}</span>
              <h2>{changed ? `${pet.name}'s recent health story has a meaningful shift.` : `PeachyPawz is learning ${pet.name}'s normal.`}</h2>
              <p>{analytics.statusReason}</p>
            </div>
            <div className="status-meta"><span>Available record range</span><strong>{earliest && latest ? `${shortDate(earliest)} — ${shortDate(latest)}` : "Starting now"}</strong></div>
          </div>
          <div className="micro-note"><ShieldCheck size={15} /> Based only on available records — not a diagnosis.</div>
        </section>

        <section className="section-block">
          <div className="section-heading"><div><span className="section-kicker"><Sparkles size={15} /> What changed?</span><h2>{analytics.changes.length ? `Changes found across ${analytics.changes.length} tracked signal${analytics.changes.length === 1 ? "" : "s"}` : "No meaningful change can be calculated yet"}</h2></div><span className="time-chip">Your records</span></div>
          <div className="change-grid">
            {analytics.changes.map((change: any) => (
              <button className="change-card" key={change.metric} onClick={() => onEvidence(change.evidenceIds)}>
                <div className={`metric-icon ${change.metric}`}><EventIcon type={change.metric} /></div>
                <div className="change-copy"><span>{change.label}</span><strong>{change.from} <ArrowRight size={14} /> {change.to}</strong><small className={change.direction === "up" ? "up" : change.direction === "down" ? "down" : "neutral"}>{change.changePercent !== undefined ? <>{change.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(change.changePercent).toFixed(1)}%</> : "Recorded state changed"}</small></div>
                <ChevronRight size={17} className="card-chevron" />
              </button>
            ))}
            {analytics.changes.length === 0 && <div className="quiet-card"><strong>More history → better context</strong><p>Add repeat measurements over time and PeachyPawz will compare new values against this pet's own earlier pattern.</p></div>}
          </div>
        </section>

        <section className="insight-hero">
          <div className="insight-head"><span className="ai-orb"><Bot size={19} /></span><span><small>Peachy Intelligence</small><strong>{analytics.primaryInsight.title}</strong></span><span className="confidence-pill">{analytics.primaryInsight.confidence}</span></div>
          <p className="insight-text">{analytics.primaryInsight.summary}</p>
          {analytics.changes.length >= 2 && <div className="relationship">{analytics.changes.map((change: any, index: number) => <span key={change.metric} style={{ display: "contents" }}><span>{change.label} {change.direction === "up" ? "↑" : change.direction === "down" ? "↓" : "changed"}</span>{index < analytics.changes.length - 1 && <ArrowRight size={15} />}</span>)}</div>}
          <p className="causation-note"><Info size={14} /> PeachyPawz can describe timing and correlation, but does not manufacture causation or diagnoses.</p>
          <div className="insight-actions"><button className="button dark" disabled={!analytics.primaryInsight.evidenceIds.length} onClick={() => onEvidence(analytics.primaryInsight.evidenceIds)}><CircleHelp size={16} /> Why am I seeing this?</button><button className="text-button" onClick={onStory}>Read health story <ArrowRight size={15} /></button></div>
        </section>

        <section className="section-block trends-section">
          <div className="section-heading"><div><span className="section-kicker"><Activity size={15} /> Personal baseline</span><h2>Compared with {pet.name}'s own normal</h2></div></div>
          <div className="trend-grid">
            <MetricTrend title="Weight" series={weight.map((item) => item.value)} value={`${weight.at(-1)?.value ?? "—"} kg`} baseline={analytics.baselines.find((item: any) => item.metric === "weight")} />
            <MetricTrend title="Activity" series={activity.map((item) => item.value)} value={`${activity.at(-1)?.value ?? "—"} min/day`} baseline={analytics.baselines.find((item: any) => item.metric === "activity")} inverse />
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading"><div><span className="section-kicker"><CalendarDays size={15} /> Recent timeline</span><h2>The records behind the story</h2></div></div>
          <div className="timeline-preview">{recent.map((event: HealthEvent) => <TimelineRow key={event.id} event={event} />)}</div>
        </section>
      </div>

      <aside className="dashboard-side">
        <section className="side-card pet-card">
          <div className="pet-profile-top"><span className="pet-avatar xl" style={{ background: pet.color }}>{pet.name[0]}</span><div><h3>{pet.name}</h3><p>{pet.breed} · {ageLabel(pet.birthDate)}</p></div><button className="icon-button"><MoreHorizontal size={18} /></button></div>
          <div className="pet-stat-row"><span><small>Sex</small><strong>{pet.sex}</strong></span><span><small>Latest weight</small><strong>{weight.at(-1)?.value ? `${weight.at(-1)?.value} kg` : "Not recorded"}</strong></span></div>
        </section>
        <section className="side-card action-card peach"><span className="side-card-icon"><MessageCircle size={19} /></span><h3>Ask about {pet.name}</h3><p>Questions are grounded in {pet.name}'s timeline, not another pet's data.</p><button className="button white" onClick={onAsk}>Ask a question <ArrowRight size={15} /></button></section>
        <section className="side-card action-card mint"><span className="side-card-icon"><Stethoscope size={19} /></span><h3>Preparing for a visit?</h3><p>Turn the available history into a concise, traceable briefing for your veterinarian.</p><button className="button white" onClick={onVet}>Prepare for Vet <ArrowRight size={15} /></button></section>
        {vaccineReminder && <section className="side-card reminder-card"><div className="reminder-title"><span className="side-card-icon subtle"><CalendarDays size={18} /></span><div><small>Upcoming</small><strong>{vaccineReminder.title}</strong></div></div><p>Due {shortDate(vaccineReminder.date)} · {sourceText(vaccineReminder)}</p></section>}
      </aside>
    </div>
  );
}

function MetricTrend({ title, series, value, baseline, inverse = false }: any) {
  const latest = series.at(-1);
  const delta = baseline?.average ? ((latest - baseline.average) / baseline.average) * 100 : 0;
  return <article className="metric-trend"><div className="metric-trend-head"><div><span>{title}</span><strong>{value}</strong></div><small className={inverse ? "down" : "up"}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}% vs baseline</small></div><Sparkline values={series} /><div className="baseline-caption"><span><i /> {baseline?.state === "reliable" ? "Personal baseline" : "Emerging baseline"}</span><strong>{baseline?.min}–{baseline?.max} {baseline?.unit}</strong></div><p>{baseline?.explanation}</p></article>;
}

function TimelineView({ pet, events, onAdd, onUpload }: { pet: Pet; events: HealthEvent[]; onAdd: () => void; onUpload: () => void }) {
  const [filter, setFilter] = useState<EventType | "all">("all");
  const [query, setQuery] = useState("");
  const visible = events.filter((event) => filter === "all" || event.type === filter).filter((event) => `${event.title} ${event.summary}`.toLowerCase().includes(query.toLowerCase()));
  const groups = visible.reduce<Record<string, HealthEvent[]>>((acc, event) => { const month = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${event.date}T12:00:00`)); (acc[month] ||= []).push(event); return acc; }, {});
  return <div className="page-stack narrow-page"><div className="page-intro"><div><span className="section-kicker"><CalendarDays size={15} /> Source of truth</span><h2>{pet.name}'s health timeline</h2><p>Every insight traces back to reviewed records you added or approved.</p></div><div className="page-actions"><button className="button secondary" onClick={onUpload}><Upload size={16} /> Import</button><button className="button primary" onClick={onAdd}><Plus size={16} /> Add record</button></div></div><div className="timeline-toolbar"><label className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search records" /></label><div className="filter-row">{["all","weight","activity","diet","symptom","vet","medication"].map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item as any)} key={item}>{item === "all" ? "All" : eventLabels[item as EventType]}</button>)}</div></div><div className="full-timeline">{Object.entries(groups).map(([month, monthEvents]) => <section key={month}><h3>{month}</h3>{monthEvents.map((event) => <TimelineRow event={event} key={event.id} detailed />)}</section>)}{visible.length === 0 && <div className="zero-state">No matching records yet. Add one manually or import a health document.</div>}</div></div>;
}

function TimelineRow({ event, detailed = false }: { event: HealthEvent; detailed?: boolean }) {
  return <article className={`timeline-row ${detailed ? "detailed" : ""}`}><div className={`timeline-icon type-${event.type}`}><EventIcon type={event.type} /></div><div className="timeline-copy"><div className="timeline-title"><strong>{event.title}</strong><span>{shortDate(event.date)}</span></div><p>{event.summary}</p>{detailed && <div className="provenance"><span>{sourceText(event)}</span>{event.confidence && <span>{event.confidence} confidence</span>}<span>{event.reviewStatus === "corrected" ? "Corrected" : "Reviewed"}</span></div>}</div>{detailed && <button className="icon-button"><MoreHorizontal size={17} /></button>}</article>;
}

function InsightsView({ pet, analytics, events, onEvidence, onStory }: { pet: Pet; analytics: AnalyticsResult; events: HealthEvent[]; onEvidence: (ids: string[]) => void; onStory: () => void }) {
  return <div className="page-stack narrow-page"><div className="page-intro"><div><span className="section-kicker"><Sparkles size={15} /> Explainable intelligence</span><h2>Insights for {pet.name}</h2><p>Ranked by evidence strength, magnitude and persistence — not fear.</p></div></div><section className="insights-feature"><div className="insights-feature-top"><span className="status-pill changes"><span /> Changes detected</span><span className="confidence-pill">{analytics.primaryInsight.confidence}</span></div><h3>{analytics.primaryInsight.title}</h3><p>{analytics.primaryInsight.summary}</p><div className="insight-evidence-summary"><strong>Evidence bundle</strong><span>{analytics.primaryInsight.evidenceIds.length} linked records</span><span>{formatDate(analytics.primaryInsight.timeRange.start)} — {formatDate(analytics.primaryInsight.timeRange.end)}</span></div><button className="button dark" onClick={() => onEvidence(analytics.primaryInsight.evidenceIds)}><FileSearch size={16} /> Inspect evidence</button></section><section className="section-block surface"><div className="section-heading"><div><span className="section-kicker">Baseline deviations</span><h2>What is unusual for {pet.name}?</h2></div></div><div className="baseline-list">{analytics.baselines.map((baseline) => <div key={baseline.metric}><div className={`metric-icon ${baseline.metric}`}><EventIcon type={baseline.metric} /></div><span><strong>{eventLabels[baseline.metric]}</strong><small>{baseline.explanation}</small></span><span className="baseline-range">{baseline.min ?? "—"}–{baseline.max ?? "—"} {baseline.unit}</span></div>)}</div></section><section className="section-block surface story-teaser"><div><span className="section-kicker"><Bot size={15} /> Narrative layer</span><h2>Turn the data into a health story</h2><p>AI receives structured analytics and evidence, then explains the timeline in cautious language.</p></div><button className="button primary" onClick={onStory}>Generate story <Sparkles size={16} /></button></section></div>;
}

function AskView({ pet, events, allowAI }: { pet: Pet; events: HealthEvent[]; allowAI: boolean }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string; answer?: ChatAnswer & { mode?: string } }>>([{ role: "assistant", text: `Ask me about ${pet.name}'s timeline. I’ll separate record-based answers from general information.` }]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { setMessages([{ role: "assistant", text: `Ask me about ${pet.name}'s timeline. I’ll separate record-based answers from general information.` }]); }, [pet.id, pet.name]);

  const send = async (text: string) => {
    const q = text.trim(); if (!q || loading) return;
    setMessages((current) => [...current, { role: "user", text: q }]); setQuestion(""); setLoading(true);
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "chat", pet, events, question: q, allowAI }) });
      const answer = await res.json();
      setMessages((current) => [...current, { role: "assistant", text: answer.answer || "I couldn't answer from the available records.", answer }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "AI insights are temporarily unavailable. Your timeline records are still available." }]);
    } finally { setLoading(false); }
  };

  const chips = ["When did activity decline begin?", `How has ${pet.name}'s weight changed?`, "Summarize the available records.", "What happened at the last vet visit?"];
  return <div className="ask-layout"><section className="chat-panel"><div className="chat-header"><span className="ai-orb large"><Bot size={22} /></span><div><h2>Ask about {pet.name}</h2><p>{allowAI ? "AI explanation + deterministic evidence" : "Deterministic timeline answers · AI consent off"}</p></div></div><div className="chat-messages">{messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>{message.role === "assistant" && <span className="chat-avatar"><Bot size={16} /></span>}<div className="bubble">{message.answer && <span className={`scope-badge ${message.answer.scope}`}>{message.answer.scope === "pet-records" ? `Based on ${pet.name}'s records` : "General information"}</span>}<p>{message.text}</p>{message.answer?.evidenceIds?.length ? <small>{message.answer.evidenceIds.length} evidence record{message.answer.evidenceIds.length > 1 ? "s" : ""} linked · {message.answer.mode === "llm" ? "AI explanation" : "deterministic answer"}</small> : null}</div></div>)}{loading && <div className="chat-message assistant"><span className="chat-avatar"><Bot size={16} /></span><div className="bubble typing"><i/><i/><i/></div></div>}</div><div className="prompt-chips">{chips.map((chip) => <button onClick={() => send(chip)} key={chip}>{chip}</button>)}</div><form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(question); }}><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={`Ask about ${pet.name}'s records…`} /><button disabled={!question.trim() || loading}><ArrowUpRight size={18} /></button></form></section><aside className="chat-trust"><ShieldCheck size={22} /><h3>How answers stay grounded</h3><ul><li>Pet ID filter prevents cross-pet retrieval.</li><li>Calculations happen before AI narration.</li><li>Evidence IDs are validated against retrieved records.</li><li>Diagnosis and medication-change language is blocked.</li><li>Imported document text is treated as untrusted data.</li></ul></aside></div>;
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
  useEffect(() => { fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "vet", pet, events }) }).then((r) => r.json()).then(setBrief); }, [pet, events]);
  return <div className="overlay centered"><section className="modal vet-modal"><div className="modal-head"><span className="modal-icon mint"><Stethoscope size={20} /></span><div><small>Prepare for Vet</small><h2>{pet.name}'s 90-day brief</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>{!brief ? <LoadingBlock label="Preparing factual timeline brief…" /> : <div className="vet-brief"><div className="brief-block"><h3>Recent changes</h3>{brief.recentChanges?.map((item: any) => <div className="brief-row" key={item.metric}><span>{item.label}</span><strong>{item.from} → {item.to}</strong>{item.changePercent !== undefined && <em>{item.changePercent > 0 ? "+" : ""}{item.changePercent.toFixed(1)}%</em>}</div>)}</div><div className="brief-block"><h3>Pattern to discuss</h3><p>{brief.pattern}</p></div><div className="brief-block"><h3>Suggested questions</h3><ol>{brief.questions?.map((question: string) => <li key={question}>{question}</li>)}</ol></div><div className="brief-source"><FileText size={17} /><p><strong>Traceable to records</strong>{brief.symptoms?.length || 0} symptom observations · {brief.visits?.length || 0} vet visit · {brief.medications?.length || 0} medication event</p></div><p className="story-disclaimer">{brief.disclaimer}</p></div>}</section></div>;
}

function AddEventSheet({ pet, onAdd, onClose, onUpload }: { pet: Pet; onAdd: (event: HealthEvent) => void; onClose: () => void; onUpload: () => void }) {
  const [type, setType] = useState<EventType>("weight"); const [value, setValue] = useState(""); const [date, setDate] = useState(todayDate());
  const submit = (e: FormEvent) => { e.preventDefault(); if (!value.trim()) return; const numeric = Number(value); const isNumeric = type === "weight" || type === "activity"; onAdd({ id: `manual-${Date.now()}`, petId: pet.id, type, date, title: `${eventLabels[type]} recorded`, summary: isNumeric ? `${numeric} ${type === "weight" ? "kg" : "min/day"}` : value, data: isNumeric ? { value: numeric, unit: type === "weight" ? "kg" : "min/day" } : type === "appetite" ? { state: value } : { note: value }, source: "manual", reviewStatus: "approved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); onClose(); };
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><aside className="drawer form-drawer"><div className="drawer-head"><div><span className="section-kicker"><Plus size={15} /> Manual entry</span><h2>Add to {pet.name}'s timeline</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><div className="event-type-grid">{(["weight","activity","appetite","symptom","medication","vet","note"] as EventType[]).map((item) => <button className={type === item ? "active" : ""} onClick={() => setType(item)} key={item}><EventIcon type={item} /><span>{eventLabels[item]}</span></button>)}</div><form className="record-form" onSubmit={submit}><label><span>Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label><span>{type === "weight" ? "Weight (kg)" : type === "activity" ? "Minutes per day" : eventLabels[type]}</span>{type === "appetite" ? <select value={value} onChange={(e) => setValue(e.target.value)}><option value="">Select</option><option>Normal</option><option>Reduced</option><option>Increased</option></select> : <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "weight" ? "e.g. 19.2" : type === "activity" ? "e.g. 68" : "Record what happened…"} />}</label><div className="form-note"><Info size={15} /> Missing data stays missing. PeachyPawz never treats “no record” as “normal.”</div><button className="button primary full" disabled={!value.trim()}>Save reviewed record</button></form><div className="drawer-divider"><span>or</span></div><button className="upload-callout" onClick={onUpload}><Upload size={20} /><span><strong>Import a document</strong><small>PDF, JPG or PNG · review before timeline</small></span><ChevronRight size={17} /></button></aside></div>;
}

function UploadSheet({ pet, allowAI, onAdd, onClose }: { pet: Pet; allowAI: boolean; onAdd: (event: HealthEvent) => void; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null); const [result, setResult] = useState<any>(null); const [loading, setLoading] = useState(false); const [date, setDate] = useState(todayDate()); const [weight, setWeight] = useState("");
  const extract = async () => { if (!file) return; setLoading(true); const form = new FormData(); form.set("file", file); form.set("allowAI", String(allowAI)); try { const res = await fetch("/api/documents/extract", { method: "POST", body: form }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setResult(data); setDate(data.extraction.date || todayDate()); setWeight(data.extraction.weight?.value?.toString() || ""); } catch (error) { setResult({ error: error instanceof Error ? error.message : "Extraction failed" }); } finally { setLoading(false); } };
  const approve = () => { if (!result?.extraction) return; const extraction = result.extraction; if (weight) onAdd({ id: `doc-weight-${Date.now()}`, petId: pet.id, type: "weight", date, title: "Weight imported", summary: `${weight} ${extraction.weight?.unit || "kg"}`, data: { value: Number(weight), unit: extraction.weight?.unit || "kg" }, source: "document_ai", sourceLabel: result.filename, sourceDocumentId: `doc-${Date.now()}`, confidence: extraction.confidence, reviewStatus: "approved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); onAdd({ id: `doc-visit-${Date.now()}`, petId: pet.id, type: extraction.documentType === "vaccination" ? "vaccine" : "vet", date, title: extraction.documentType === "vaccination" ? "Vaccination imported" : "Vet visit imported", summary: extraction.followUp || extraction.notes || `Imported from ${result.filename}`, data: { clinic: extraction.clinic || "Unknown", followUp: extraction.followUp || null }, source: "document_ai", sourceLabel: result.filename, sourceDocumentId: `doc-${Date.now()}`, confidence: extraction.confidence, reviewStatus: "approved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); onClose(); };
  const detectedName = result?.extraction?.petName?.trim();
  const nameMismatch = detectedName && detectedName.toLowerCase() !== pet.name.toLowerCase();
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><aside className="drawer form-drawer"><div className="drawer-head"><div><span className="section-kicker"><Upload size={15} /> Document intelligence</span><h2>Import a health record</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>{!result?.extraction ? <><label className="drop-zone"><input type="file" accept=".pdf,.jpg,.jpeg,.png,.txt" onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }} /><span className="drop-icon"><FileText size={23} /></span><strong>{file ? file.name : "Choose a veterinary document"}</strong><p>PDF, JPG, PNG or TXT · max 8 MB</p><small>Nothing enters {pet.name}'s timeline until you review and approve it.</small></label>{result?.error && <div className="error-banner">{result.error}</div>}<button className="button primary full" onClick={extract} disabled={!file || loading}>{loading ? "Extracting…" : "Extract for review"}</button><div className="sample-tip"><FileSearch size={16} /><p>{allowAI ? "AI analysis is enabled for this import with your onboarding consent. PDF text still uses deterministic parsing where possible." : "AI analysis is off. Text-based PDF/TXT extraction still works; image files will require manual review."}</p></div></> : <div className="review-panel"><div className="review-banner"><ShieldCheck size={18} /><span><strong>Proposed fields — review required</strong><small>{result.extraction.confidence} confidence · {result.filename}</small></span></div>{result.extraction.warnings?.map((warning: string) => <div className="warning-line" key={warning}><Info size={15} /> {warning}</div>)}{nameMismatch && <div className="error-banner"><strong>Wrong-pet check:</strong> this document appears to mention “{detectedName}”, but you are importing into {pet.name}. Verify before approving.</div>}<label><span>Assign to pet</span><select value={pet.name} disabled><option>{pet.name}</option></select><small>The destination pet is explicit. PeachyPawz never silently reassigns a health record.</small></label><label><span>Visit date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label><span>Weight</span><div className="input-with-unit"><input value={weight} onChange={(e) => setWeight(e.target.value)} /><span>{result.extraction.weight?.unit || "kg"}</span></div></label><label><span>Clinic</span><input value={result.extraction.clinic || ""} readOnly /></label><label><span>Extracted note</span><textarea value={result.extraction.followUp || result.extraction.notes || ""} readOnly /></label><button className="button primary full" onClick={approve}><Check size={17} /> Approve & add to {pet.name}'s timeline</button><button className="button secondary full" onClick={() => setResult(null)}>Choose a different file</button></div>}</aside></div>;
}

function LoadingBlock({ label }: { label: string }) { return <div className="loading-block"><span className="spinner" /><p>{label}</p></div>; }
function ErrorBlock() { return <div className="error-block"><Info size={20} /><h3>AI narrative unavailable</h3><p>Your records and deterministic analytics still work. Try again or continue using the timeline.</p></div>; }
