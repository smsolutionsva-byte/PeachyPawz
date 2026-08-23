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
import { DEMO_ANCHOR_DATE, pets, seedEvents } from "@/lib/seed";
import { ChatAnswer, EventType, HealthEvent, Pet } from "@/lib/types";
import { EventIcon } from "./EventIcon";
import { Sparkline } from "./Sparkline";

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "timeline", label: "Timeline", icon: CalendarDays },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "ask", label: "Ask", icon: MessageCircle },
] as const;
type View = (typeof navItems)[number]["id"];

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

const sourceText = (event: HealthEvent) => {
  if (event.sourceLabel) return event.sourceLabel;
  if (event.source === "document_ai") return "Imported document";
  if (event.source === "device") return "Connected device";
  if (event.source === "vet") return "Veterinary record";
  return "Manual entry";
};

export default function PeachyApp() {
  const [view, setView] = useState<View>("home");
  const [selectedPetId, setSelectedPetId] = useState("max");
  const [events, setEvents] = useState<HealthEvent[]>(seedEvents);
  const [evidenceIds, setEvidenceIds] = useState<string[] | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);
  const [vetOpen, setVetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("peachypawz:events:v1");
      if (stored) setEvents(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("peachypawz:events:v1", JSON.stringify(events)); } catch {}
  }, [events]);

  const pet = pets.find((item) => item.id === selectedPetId) || pets[0];
  const petEvents = useMemo(() => events.filter((event) => event.petId === pet.id).sort((a, b) => b.date.localeCompare(a.date)), [events, pet.id]);
  const analytics = useMemo(() => analyzePet(events, pet.id), [events, pet.id]);
  const evidence = useMemo(() => evidenceIds ? evidenceFor(events, evidenceIds) : [], [events, evidenceIds]);

  const addEvent = (event: HealthEvent) => setEvents((current) => [event, ...current]);
  const resetDemo = () => {
    setEvents(seedEvents);
    localStorage.removeItem("peachypawz:events:v1");
    setSelectedPetId("max");
    setView("home");
  };

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
        <button className="ghost-link" onClick={resetDemo}>Reset demo data</button>
        <p className="sidebar-footnote">Prototype · PetOlife AI Code-a-Thon</p>
      </aside>

      <main className="main-shell">
        <header className="mobile-header">
          <BrandMark compact />
          <button className="icon-button" aria-label="Menu"><Menu size={21} /></button>
        </header>

        <div className="topbar">
          <div>
            <p className="eyebrow">Health intelligence timeline</p>
            <h1>{view === "home" ? `Good morning, ${pet.name}'s human` : navItems.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <PetSwitcher pet={pet} selectedId={selectedPetId} onSelect={setSelectedPetId} />
            <button className="button secondary desktop-only" onClick={() => setUploadOpen(true)}><Upload size={17} /> Import record</button>
            <button className="button primary desktop-only" onClick={() => setAddOpen(true)}><Plus size={17} /> Add record</button>
          </div>
        </div>

        <section className="content-wrap">
          {view === "home" && (
            <HomeView pet={pet} events={petEvents} analytics={analytics} onEvidence={setEvidenceIds} onStory={() => setStoryOpen(true)} onVet={() => setVetOpen(true)} onAsk={() => setView("ask")} />
          )}
          {view === "timeline" && <TimelineView pet={pet} events={petEvents} onAdd={() => setAddOpen(true)} onUpload={() => setUploadOpen(true)} />}
          {view === "insights" && <InsightsView pet={pet} analytics={analytics} events={petEvents} onEvidence={setEvidenceIds} onStory={() => setStoryOpen(true)} />}
          {view === "ask" && <AskView pet={pet} events={petEvents} />}
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
      {storyOpen && <StoryModal pet={pet} events={petEvents} onClose={() => setStoryOpen(false)} />}
      {vetOpen && <VetBriefModal pet={pet} events={petEvents} onClose={() => setVetOpen(false)} />}
      {addOpen && <AddEventSheet pet={pet} onAdd={addEvent} onClose={() => setAddOpen(false)} onUpload={() => { setAddOpen(false); setUploadOpen(true); }} />}
      {uploadOpen && <UploadSheet pet={pet} onAdd={addEvent} onClose={() => setUploadOpen(false)} />}
    </div>
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

function PetSwitcher({ pet, selectedId, onSelect }: { pet: Pet; selectedId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pet-switcher-wrap">
      <button className="pet-switcher" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="pet-avatar" style={{ background: pet.color }}>{pet.name[0]}</span>
        <span><strong>{pet.name}</strong><small>{pet.breed}</small></span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="pet-menu">
          {pets.map((item) => <button key={item.id} className={selectedId === item.id ? "selected" : ""} onClick={() => { onSelect(item.id); setOpen(false); }}><span className="pet-avatar small" style={{ background: item.color }}>{item.name[0]}</span><span><strong>{item.name}</strong><small>{item.breed}</small></span>{selectedId === item.id && <Check size={16} />}</button>)}
        </div>
      )}
    </div>
  );
}

function HomeView({ pet, events, analytics, onEvidence, onStory, onVet, onAsk }: any) {
  const weight = metricSeries(events, pet.id, "weight");
  const activity = metricSeries(events, pet.id, "activity");
  const recent = events.filter((event: HealthEvent) => event.date <= DEMO_ANCHOR_DATE).slice(0, 4);
  if (events.length < 3) return <EmptyState pet={pet} />;

  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <section className="status-card">
          <div className="status-row">
            <div>
              <span className="status-pill changes"><span /> Changes detected</span>
              <h2>{pet.name}'s recent health story has a meaningful shift.</h2>
              <p>{analytics.statusReason}</p>
            </div>
            <div className="status-meta"><span>90-day view</span><strong>May 26 — Aug 23</strong></div>
          </div>
          <div className="micro-note"><ShieldCheck size={15} /> Based only on available records — not a diagnosis.</div>
        </section>

        <section className="section-block">
          <div className="section-heading"><div><span className="section-kicker"><Sparkles size={15} /> What changed?</span><h2>Three signals moved from {pet.name}'s earlier pattern</h2></div><span className="time-chip">Last 90 days</span></div>
          <div className="change-grid">
            {analytics.changes.map((change: any) => (
              <button className="change-card" key={change.metric} onClick={() => onEvidence(change.evidenceIds)}>
                <div className={`metric-icon ${change.metric}`}><EventIcon type={change.metric} /></div>
                <div className="change-copy"><span>{change.label}</span><strong>{change.from} <ArrowRight size={14} /> {change.to}</strong><small className={change.direction === "up" ? "up" : change.direction === "down" ? "down" : "neutral"}>{change.changePercent !== undefined ? <>{change.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(change.changePercent).toFixed(1)}%</> : "Recorded state changed"}</small></div>
                <ChevronRight size={17} className="card-chevron" />
              </button>
            ))}
          </div>
        </section>

        <section className="insight-hero">
          <div className="insight-head"><span className="ai-orb"><Bot size={19} /></span><span><small>Peachy Intelligence</small><strong>Activity & weight pattern</strong></span><span className="confidence-pill">{analytics.primaryInsight.confidence}</span></div>
          <p className="insight-text">{analytics.primaryInsight.summary}</p>
          <div className="relationship"><span>Diet change</span><ArrowRight size={15} /><span>Activity decline</span><ArrowRight size={15} /><span>Weight increase</span></div>
          <p className="causation-note"><Info size={14} /> These events overlap in time. PeachyPawz does not claim the diet change caused the later measurements.</p>
          <div className="insight-actions"><button className="button dark" onClick={() => onEvidence(analytics.primaryInsight.evidenceIds)}><CircleHelp size={16} /> Why am I seeing this?</button><button className="text-button" onClick={onStory}>Read health story <ArrowRight size={15} /></button></div>
        </section>

        <section className="section-block trends-section">
          <div className="section-heading"><div><span className="section-kicker"><Activity size={15} /> Personal baseline</span><h2>Compared with {pet.name}'s own normal</h2></div></div>
          <div className="trend-grid">
            <MetricTrend title="Weight" series={weight.map((item) => item.value)} value={`${weight.at(-1)?.value ?? "—"} kg`} baseline={analytics.baselines.find((item: any) => item.metric === "weight")} />
            <MetricTrend title="Activity" series={activity.map((item) => item.value)} value={`${activity.at(-1)?.value ?? "—"} min/day`} baseline={analytics.baselines.find((item: any) => item.metric === "activity")} inverse />
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading"><div><span className="section-kicker"><CalendarDays size={15} /> Recent timeline</span><h2>The records behind the story</h2></div><button className="text-button" onClick={() => window.scrollTo({ top: 0 })}>Recent</button></div>
          <div className="timeline-preview">{recent.map((event: HealthEvent) => <TimelineRow key={event.id} event={event} />)}</div>
        </section>
      </div>

      <aside className="dashboard-side">
        <section className="side-card pet-card">
          <div className="pet-profile-top"><span className="pet-avatar xl" style={{ background: pet.color }}>{pet.name[0]}</span><div><h3>{pet.name}</h3><p>{pet.breed} · 4 years</p></div><button className="icon-button"><MoreHorizontal size={18} /></button></div>
          <div className="pet-stat-row"><span><small>Sex</small><strong>{pet.sex}</strong></span><span><small>Latest weight</small><strong>{weight.at(-1)?.value ?? "—"} kg</strong></span></div>
        </section>
        <section className="side-card action-card peach"><span className="side-card-icon"><MessageCircle size={19} /></span><h3>Ask about {pet.name}</h3><p>Questions are grounded in {pet.name}'s timeline, not another pet's data.</p><button className="button white" onClick={onAsk}>Ask a question <ArrowRight size={15} /></button></section>
        <section className="side-card action-card mint"><span className="side-card-icon"><Stethoscope size={19} /></span><h3>Preparing for a visit?</h3><p>Turn the last 90 days into a concise, traceable briefing for your veterinarian.</p><button className="button white" onClick={onVet}>Prepare for Vet <ArrowRight size={15} /></button></section>
        <section className="side-card reminder-card"><div className="reminder-title"><span className="side-card-icon subtle"><CalendarDays size={18} /></span><div><small>Upcoming</small><strong>Annual booster</strong></div></div><p>Due Sep 10 · from Oak & Paw Clinic</p><button className="text-button">View reminder <ArrowRight size={15} /></button></section>
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
  const visible = events.filter((event) => event.date <= DEMO_ANCHOR_DATE).filter((event) => filter === "all" || event.type === filter).filter((event) => `${event.title} ${event.summary}`.toLowerCase().includes(query.toLowerCase()));
  const groups = visible.reduce<Record<string, HealthEvent[]>>((acc, event) => { const month = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${event.date}T12:00:00`)); (acc[month] ||= []).push(event); return acc; }, {});
  return <div className="page-stack narrow-page"><div className="page-intro"><div><span className="section-kicker"><CalendarDays size={15} /> Source of truth</span><h2>{pet.name}'s health timeline</h2><p>Every insight traces back to these reviewed records.</p></div><div className="page-actions"><button className="button secondary" onClick={onUpload}><Upload size={16} /> Import</button><button className="button primary" onClick={onAdd}><Plus size={16} /> Add record</button></div></div><div className="timeline-toolbar"><label className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search records" /></label><div className="filter-row">{["all","weight","activity","diet","symptom","vet","medication"].map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item as any)} key={item}>{item === "all" ? "All" : eventLabels[item as EventType]}</button>)}</div></div><div className="full-timeline">{Object.entries(groups).map(([month, monthEvents]) => <section key={month}><h3>{month}</h3>{monthEvents.map((event) => <TimelineRow event={event} key={event.id} detailed />)}</section>)}{visible.length === 0 && <div className="zero-state">No matching records.</div>}</div></div>;
}

function TimelineRow({ event, detailed = false }: { event: HealthEvent; detailed?: boolean }) {
  return <article className={`timeline-row ${detailed ? "detailed" : ""}`}><div className={`timeline-icon type-${event.type}`}><EventIcon type={event.type} /></div><div className="timeline-copy"><div className="timeline-title"><strong>{event.title}</strong><span>{shortDate(event.date)}</span></div><p>{event.summary}</p>{detailed && <div className="provenance"><span>{sourceText(event)}</span>{event.confidence && <span>{event.confidence} confidence</span>}<span>{event.reviewStatus === "corrected" ? "Corrected" : "Reviewed"}</span></div>}</div>{detailed && <button className="icon-button"><MoreHorizontal size={17} /></button>}</article>;
}

function InsightsView({ pet, analytics, events, onEvidence, onStory }: any) {
  return <div className="page-stack narrow-page"><div className="page-intro"><div><span className="section-kicker"><Sparkles size={15} /> Explainable intelligence</span><h2>Insights for {pet.name}</h2><p>Ranked by evidence strength, magnitude and persistence — not fear.</p></div></div><section className="insights-feature"><div className="insights-feature-top"><span className="status-pill changes"><span /> Changes detected</span><span className="confidence-pill">{analytics.primaryInsight.confidence}</span></div><h3>{analytics.primaryInsight.title}</h3><p>{analytics.primaryInsight.summary}</p><div className="insight-evidence-summary"><strong>Evidence bundle</strong><span>{analytics.primaryInsight.evidenceIds.length} linked records</span><span>{formatDate(analytics.primaryInsight.timeRange.start)} — {formatDate(analytics.primaryInsight.timeRange.end)}</span></div><button className="button dark" onClick={() => onEvidence(analytics.primaryInsight.evidenceIds)}><FileSearch size={16} /> Inspect evidence</button></section><section className="section-block surface"><div className="section-heading"><div><span className="section-kicker">Baseline deviations</span><h2>What is unusual for {pet.name}?</h2></div></div><div className="baseline-list">{analytics.baselines.map((baseline: any) => <div key={baseline.metric}><div className={`metric-icon ${baseline.metric}`}><EventIcon type={baseline.metric} /></div><span><strong>{eventLabels[baseline.metric]}</strong><small>{baseline.explanation}</small></span><span className="baseline-range">{baseline.min ?? "—"}–{baseline.max ?? "—"} {baseline.unit}</span></div>)}</div></section><section className="section-block surface story-teaser"><div><span className="section-kicker"><Bot size={15} /> Narrative layer</span><h2>Turn the data into a health story</h2><p>AI receives structured analytics and evidence, then explains the timeline in cautious language.</p></div><button className="button primary" onClick={onStory}>Generate story <Sparkles size={16} /></button></section></div>;
}

function AskView({ pet, events }: { pet: Pet; events: HealthEvent[] }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string; answer?: ChatAnswer & { mode?: string } }>>([{ role: "assistant", text: `Ask me about ${pet.name}'s timeline. I’ll separate record-based answers from general information.` }]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { setMessages([{ role: "assistant", text: `Ask me about ${pet.name}'s timeline. I’ll separate record-based answers from general information.` }]); }, [pet.id, pet.name]);

  const send = async (text: string) => {
    const q = text.trim(); if (!q || loading) return;
    setMessages((current) => [...current, { role: "user", text: q }]); setQuestion(""); setLoading(true);
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "chat", pet, events, question: q }) });
      const answer = await res.json();
      setMessages((current) => [...current, { role: "assistant", text: answer.answer || "I couldn't answer from the available records.", answer }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "AI insights are temporarily unavailable. Your timeline records are still available." }]);
    } finally { setLoading(false); }
  };

  const chips = ["When did activity decline begin?", "How has Max's weight changed?", "Summarize the last 90 days.", "What happened at the last vet visit?"];
  return <div className="ask-layout"><section className="chat-panel"><div className="chat-header"><span className="ai-orb large"><Bot size={22} /></span><div><h2>Ask about {pet.name}</h2><p>Timeline-grounded chat · evidence when available</p></div></div><div className="chat-messages">{messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>{message.role === "assistant" && <span className="chat-avatar"><Bot size={16} /></span>}<div className="bubble">{message.answer && <span className={`scope-badge ${message.answer.scope}`}>{message.answer.scope === "pet-records" ? `Based on ${pet.name}'s records` : "General information"}</span>}<p>{message.text}</p>{message.answer?.evidenceIds?.length ? <small>{message.answer.evidenceIds.length} evidence record{message.answer.evidenceIds.length > 1 ? "s" : ""} linked · {message.answer.mode === "llm" ? "AI explanation" : "deterministic answer"}</small> : null}</div></div>)}{loading && <div className="chat-message assistant"><span className="chat-avatar"><Bot size={16} /></span><div className="bubble typing"><i/><i/><i/></div></div>}</div><div className="prompt-chips">{chips.map((chip) => <button onClick={() => send(chip.replace("Max", pet.name))} key={chip}>{chip.replace("Max", pet.name)}</button>)}</div><form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(question); }}><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={`Ask about ${pet.name}'s records…`} /><button disabled={!question.trim() || loading}><ArrowUpRight size={18} /></button></form></section><aside className="chat-trust"><ShieldCheck size={22} /><h3>How answers stay grounded</h3><ul><li>Pet ID filter prevents cross-pet retrieval.</li><li>Calculations happen before AI narration.</li><li>Evidence IDs are validated against the retrieved records.</li><li>Diagnosis and medication-change language is blocked.</li><li>Imported document text is treated as untrusted data.</li></ul></aside></div>;
}

function EmptyState({ pet }: { pet: Pet }) {
  return <div className="empty-state"><span className="empty-paw">🐾</span><h2>Start {pet.name}'s health story</h2><p>There are not enough records yet to establish a personal baseline or generate meaningful insights.</p><div className="empty-actions"><button className="button primary"><Plus size={16} /> Add weight</button><button className="button secondary"><Upload size={16} /> Upload document</button></div><small>As the timeline grows, PeachyPawz learns this pet's normal patterns.</small></div>;
}

function EvidenceDrawer({ pet, insight, evidence, onClose }: any) {
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><aside className="drawer"><div className="drawer-head"><div><span className="section-kicker"><FileSearch size={15} /> Explainability</span><h2>Why am I seeing this?</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><p className="drawer-lead">This insight is based on reviewed records from {pet.name}'s timeline. PeachyPawz found changes that occurred during overlapping periods.</p><div className="evidence-stats"><span><strong>{evidence.length}</strong><small>Linked records</small></span><span><strong>{insight.confidence.replace(" confidence", "")}</strong><small>Evidence confidence</small></span></div><div className="calculation-card"><strong>Calculated change</strong><div><span>Weight</span><b>18.1 → 19.4 kg</b><em>+7.2%</em></div><div><span>Activity</span><b>82 → 63 min/day</b><em>−23.2%</em></div><p>Arithmetic is deterministic. The AI does not calculate these values.</p></div><div className="evidence-list"><h3>Evidence</h3>{evidence.map((event: HealthEvent) => <TimelineRow event={event} detailed key={event.id} />)}</div><div className="safety-card"><ShieldCheck size={18} /><p><strong>What this does not mean</strong>This timeline shows temporal correlation, not proven causation or a diagnosis.</p></div></aside></div>;
}

function StoryModal({ pet, events, onClose }: { pet: Pet; events: HealthEvent[]; onClose: () => void }) {
  const [story, setStory] = useState<any>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "story", pet, events }) }).then((r) => r.json()).then((data) => active && setStory(data)).catch(() => active && setStory({ error: true })).finally(() => active && setLoading(false)); return () => { active = false; }; }, [pet, events]);
  return <div className="overlay centered"><section className="modal story-modal"><div className="modal-head"><span className="ai-orb"><Bot size={19} /></span><div><small>AI Health Story</small><h2>{pet.name}'s last 90 days</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>{loading ? <LoadingBlock label="Building the story from evidence…" /> : story?.error ? <ErrorBlock /> : <><div className="story-mode"><ShieldCheck size={15} /> {story.mode === "llm" ? "AI narrative grounded in timeline evidence" : "Deterministic demo narrative — no API key required"}</div><div className="story-body">{story.paragraphs?.map((paragraph: string, index: number) => <div className="story-chapter" key={index}><span>{String(index + 1).padStart(2, "0")}</span><p>{paragraph}</p></div>)}</div><div className="responsible-action"><Stethoscope size={19} /><div><strong>Responsible next action</strong><p>{story.action}</p></div></div><p className="story-disclaimer">PeachyPawz summarizes records and patterns. It does not diagnose conditions or replace a veterinarian.</p></>}</section></div>;
}

function VetBriefModal({ pet, events, onClose }: { pet: Pet; events: HealthEvent[]; onClose: () => void }) {
  const [brief, setBrief] = useState<any>(null);
  useEffect(() => { fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "vet", pet, events }) }).then((r) => r.json()).then(setBrief); }, [pet, events]);
  return <div className="overlay centered"><section className="modal vet-modal"><div className="modal-head"><span className="modal-icon mint"><Stethoscope size={20} /></span><div><small>Prepare for Vet</small><h2>{pet.name}'s 90-day brief</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>{!brief ? <LoadingBlock label="Preparing factual timeline brief…" /> : <div className="vet-brief"><div className="brief-block"><h3>Recent changes</h3>{brief.recentChanges?.map((item: any) => <div className="brief-row" key={item.metric}><span>{item.label}</span><strong>{item.from} → {item.to}</strong>{item.changePercent !== undefined && <em>{item.changePercent > 0 ? "+" : ""}{item.changePercent.toFixed(1)}%</em>}</div>)}</div><div className="brief-block"><h3>Pattern to discuss</h3><p>{brief.pattern}</p></div><div className="brief-block"><h3>Suggested questions</h3><ol>{brief.questions?.map((question: string) => <li key={question}>{question}</li>)}</ol></div><div className="brief-source"><FileText size={17} /><p><strong>Traceable to records</strong>{brief.symptoms?.length || 0} symptom observations · {brief.visits?.length || 0} vet visit · {brief.medications?.length || 0} medication event</p></div><p className="story-disclaimer">{brief.disclaimer}</p></div>}</section></div>;
}

function AddEventSheet({ pet, onAdd, onClose, onUpload }: { pet: Pet; onAdd: (event: HealthEvent) => void; onClose: () => void; onUpload: () => void }) {
  const [type, setType] = useState<EventType>("weight"); const [value, setValue] = useState(""); const [date, setDate] = useState(DEMO_ANCHOR_DATE);
  const submit = (e: FormEvent) => { e.preventDefault(); if (!value.trim()) return; const numeric = Number(value); const isNumeric = type === "weight" || type === "activity"; onAdd({ id: `manual-${Date.now()}`, petId: pet.id, type, date, title: `${eventLabels[type]} recorded`, summary: isNumeric ? `${numeric} ${type === "weight" ? "kg" : "min/day"}` : value, data: isNumeric ? { value: numeric, unit: type === "weight" ? "kg" : "min/day" } : type === "appetite" ? { state: value } : { note: value }, source: "manual", reviewStatus: "approved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); onClose(); };
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><aside className="drawer form-drawer"><div className="drawer-head"><div><span className="section-kicker"><Plus size={15} /> Manual entry</span><h2>Add to {pet.name}'s timeline</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><div className="event-type-grid">{(["weight","activity","appetite","symptom","medication","vet","note"] as EventType[]).map((item) => <button className={type === item ? "active" : ""} onClick={() => setType(item)} key={item}><EventIcon type={item} /><span>{eventLabels[item]}</span></button>)}</div><form className="record-form" onSubmit={submit}><label><span>Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label><span>{type === "weight" ? "Weight (kg)" : type === "activity" ? "Minutes per day" : eventLabels[type]}</span>{type === "appetite" ? <select value={value} onChange={(e) => setValue(e.target.value)}><option value="">Select</option><option>Normal</option><option>Reduced</option><option>Increased</option></select> : <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "weight" ? "e.g. 19.2" : type === "activity" ? "e.g. 68" : "Record what happened…"} />}</label><div className="form-note"><Info size={15} /> Missing data stays missing. PeachyPawz never treats “no record” as “normal.”</div><button className="button primary full" disabled={!value.trim()}>Save reviewed record</button></form><div className="drawer-divider"><span>or</span></div><button className="upload-callout" onClick={onUpload}><Upload size={20} /><span><strong>Import a document</strong><small>PDF, JPG or PNG · review before timeline</small></span><ChevronRight size={17} /></button></aside></div>;
}

function UploadSheet({ pet, onAdd, onClose }: { pet: Pet; onAdd: (event: HealthEvent) => void; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null); const [result, setResult] = useState<any>(null); const [loading, setLoading] = useState(false); const [petName, setPetName] = useState(pet.name); const [date, setDate] = useState(DEMO_ANCHOR_DATE); const [weight, setWeight] = useState("");
  const extract = async () => { if (!file) return; setLoading(true); const form = new FormData(); form.set("file", file); try { const res = await fetch("/api/documents/extract", { method: "POST", body: form }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setResult(data); setPetName(data.extraction.petName || pet.name); setDate(data.extraction.date || DEMO_ANCHOR_DATE); setWeight(data.extraction.weight?.value?.toString() || ""); } catch (error) { setResult({ error: error instanceof Error ? error.message : "Extraction failed" }); } finally { setLoading(false); } };
  const approve = () => { if (!result?.extraction) return; const extraction = result.extraction; const assignedPet = pets.find((item) => item.name.toLowerCase() === petName.toLowerCase()) || pet; if (weight) onAdd({ id: `doc-weight-${Date.now()}`, petId: assignedPet.id, type: "weight", date, title: "Weight imported", summary: `${weight} ${extraction.weight?.unit || "kg"}`, data: { value: Number(weight), unit: extraction.weight?.unit || "kg" }, source: "document_ai", sourceLabel: result.filename, sourceDocumentId: `doc-${Date.now()}`, confidence: extraction.confidence, reviewStatus: "approved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); onAdd({ id: `doc-visit-${Date.now()}`, petId: assignedPet.id, type: extraction.documentType === "vaccination" ? "vaccine" : "vet", date, title: extraction.documentType === "vaccination" ? "Vaccination imported" : "Vet visit imported", summary: extraction.followUp || extraction.notes || `Imported from ${result.filename}`, data: { clinic: extraction.clinic || "Unknown", followUp: extraction.followUp || null }, source: "document_ai", sourceLabel: result.filename, sourceDocumentId: `doc-${Date.now()}`, confidence: extraction.confidence, reviewStatus: "approved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); onClose(); };
  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><aside className="drawer form-drawer"><div className="drawer-head"><div><span className="section-kicker"><Upload size={15} /> Document intelligence</span><h2>Import a health record</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>{!result?.extraction ? <><label className="drop-zone"><input type="file" accept=".pdf,.jpg,.jpeg,.png,.txt" onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }} /><span className="drop-icon"><FileText size={23} /></span><strong>{file ? file.name : "Choose a veterinary document"}</strong><p>PDF, JPG, PNG or TXT · max 8 MB</p><small>Nothing enters the timeline until you review and approve it.</small></label>{result?.error && <div className="error-banner">{result.error}</div>}<button className="button primary full" onClick={extract} disabled={!file || loading}>{loading ? "Extracting…" : "Extract for review"}</button><div className="sample-tip"><FileSearch size={16} /><p>For the no-API demo, upload <strong>public/demo/Max_Vet_Report.pdf</strong>. PDF text extraction works locally; image OCR uses the optional server-side AI key.</p></div></> : <div className="review-panel"><div className="review-banner"><ShieldCheck size={18} /><span><strong>AI proposed fields — review required</strong><small>{result.extraction.confidence} confidence · {result.filename}</small></span></div>{result.extraction.warnings?.map((warning: string) => <div className="warning-line" key={warning}><Info size={15} /> {warning}</div>)}<label><span>Assign to pet</span><select value={petName} onChange={(e) => setPetName(e.target.value)}>{pets.map((item) => <option key={item.id}>{item.name}</option>)}</select><small>Wrong-pet protection: assignment is explicit before save.</small></label><label><span>Visit date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label><span>Weight</span><div className="input-with-unit"><input value={weight} onChange={(e) => setWeight(e.target.value)} /><span>{result.extraction.weight?.unit || "kg"}</span></div></label><label><span>Clinic</span><input value={result.extraction.clinic || ""} readOnly /></label><label><span>Extracted note</span><textarea value={result.extraction.followUp || result.extraction.notes || ""} readOnly /></label><button className="button primary full" onClick={approve}><Check size={17} /> Approve & add to timeline</button><button className="button secondary full" onClick={() => setResult(null)}>Choose a different file</button></div>}</aside></div>;
}

function LoadingBlock({ label }: { label: string }) { return <div className="loading-block"><span className="spinner" /><p>{label}</p></div>; }
function ErrorBlock() { return <div className="error-block"><Info size={20} /><h3>AI narrative unavailable</h3><p>Your records and deterministic analytics still work. Try again or continue using the timeline.</p></div>; }
