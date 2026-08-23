import { AnalyticsResult, Baseline, HealthEvent, Insight, MetricChange } from "./types";
import { displayWeightKg, normalizeWeight } from "./units";

const byDate = (a: HealthEvent, b: HealthEvent) => a.date.localeCompare(b.date);
const metricEvents = (events: HealthEvent[], type: HealthEvent["type"]) =>
  events.filter((event) => event.type === type).sort(byDate);

const pct = (from: number, to: number) => from === 0 ? null : ((to - from) / from) * 100;
const round1 = (value: number) => Math.round(value * 10) / 10;

export function calculateBaseline(events: HealthEvent[], metric: "weight" | "activity"): Baseline {
  const items = metricEvents(events, metric).filter((event) => typeof event.data.value === "number");
  const baselineItems = items.slice(0, Math.min(metric === "activity" ? 4 : 3, items.length));
  const values = baselineItems.map((item) => {
    const value = item.data.value as number;
    return metric === "weight" ? normalizeWeight(value, item.data.unit as string | undefined).value : value;
  });
  const unit = metric === "weight" ? "kg" : ((baselineItems[0]?.data.unit as string) || "min/day");

  if (values.length < 3) {
    return {
      metric,
      state: values.length < 2 ? "insufficient" : "emerging",
      sampleCount: values.length,
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
      average: values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null,
      unit,
      explanation: values.length < 2
        ? "Not enough records to establish a reliable baseline yet."
        : `We're beginning to learn this pet's normal ${metric} range.`,
    };
  }

  const average = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    metric,
    state: values.length >= 4 ? "reliable" : "emerging",
    sampleCount: values.length,
    min: round1(Math.min(...values)),
    max: round1(Math.max(...values)),
    average: round1(average),
    unit,
    explanation:
      values.length >= 4
        ? `Based on ${values.length} earlier records in this timeline.`
        : `An emerging baseline based on ${values.length} records.`,
  };
}

function changeForNumericMetric(events: HealthEvent[], type: "weight" | "activity", label: string): MetricChange | null {
  const items = metricEvents(events, type).filter((event) => typeof event.data.value === "number");
  if (items.length < 2) return null;
  const first = items[0];
  const last = items[items.length - 1];
  const firstRaw = first.data.value as number;
  const lastRaw = last.data.value as number;
  const from = type === "weight" ? normalizeWeight(firstRaw, first.data.unit as string | undefined).value : firstRaw;
  const to = type === "weight" ? normalizeWeight(lastRaw, last.data.unit as string | undefined).value : lastRaw;
  const unit = type === "weight" ? "kg" : ((last.data.unit as string) || "");
  const rawChange = pct(from, to);
  const change = rawChange === null ? undefined : round1(rawChange);
  return {
    metric: type,
    label,
    from: `${type === "weight" ? displayWeightKg(from) : round1(from)} ${unit}`,
    to: `${type === "weight" ? displayWeightKg(to) : round1(to)} ${unit}`,
    changePercent: change,
    direction: change === undefined ? (to > from ? "up" : to < from ? "down" : "stable") : change > 1 ? "up" : change < -1 ? "down" : "stable",
    evidenceIds: [first.id, last.id],
  };
}

function appetiteChange(events: HealthEvent[]): MetricChange | null {
  const items = metricEvents(events, "appetite");
  if (items.length < 2) return null;
  const first = items[0];
  const last = items[items.length - 1];
  const from = String(first.data.state ?? "Unknown");
  const to = String(last.data.state ?? "Unknown");
  return {
    metric: "appetite",
    label: "Appetite",
    from,
    to,
    direction: from === to ? "stable" : "changed",
    evidenceIds: [first.id, last.id],
  };
}

export function analyzePet(events: HealthEvent[], petId: string): AnalyticsResult {
  const petEvents = events.filter((event) => event.petId === petId && event.reviewStatus !== "pending").sort(byDate);
  const changes = [
    changeForNumericMetric(petEvents, "weight", "Weight"),
    changeForNumericMetric(petEvents, "activity", "Activity"),
    appetiteChange(petEvents),
  ].filter(Boolean) as MetricChange[];

  const baselines = [calculateBaseline(petEvents, "weight"), calculateBaseline(petEvents, "activity")];
  const weight = changes.find((change) => change.metric === "weight");
  const activity = changes.find((change) => change.metric === "activity");
  const appetite = changes.find((change) => change.metric === "appetite");
  const diet = metricEvents(petEvents, "diet")[0];

  const evidenceIds = Array.from(
    new Set([
      ...(weight?.evidenceIds ?? []),
      ...(activity?.evidenceIds ?? []),
      ...(appetite?.evidenceIds ?? []),
      ...(diet ? [diet.id] : []),
    ]),
  );

  const firstEvidence = petEvents.find((event) => evidenceIds.includes(event.id));
  const lastEvidence = [...petEvents].reverse().find((event) => evidenceIds.includes(event.id));

  const hasMeaningfulPattern =
    (weight?.changePercent ?? 0) > 5 && (activity?.changePercent ?? 0) < -15;

  const dietContext = diet
    ? ` A diet change was also recorded on ${diet.date}; this is temporal context only and does not establish causation.`
    : "";

  const primaryInsight: Insight = {
    id: "insight-activity-weight",
    title: hasMeaningfulPattern ? "Activity & weight changed together" : "Recent health pattern",
    summary: hasMeaningfulPattern
      ? `Weight increased ${Math.abs(weight?.changePercent ?? 0).toFixed(1)}% while activity decreased ${Math.abs(activity?.changePercent ?? 0).toFixed(1)}%.${dietContext}`
      : "There is not enough evidence for a strong multi-metric pattern yet.",
    confidence: evidenceIds.length >= 6 ? "High confidence" : evidenceIds.length >= 3 ? "Moderate confidence" : "Limited evidence",
    evidenceIds,
    timeRange: {
      start: firstEvidence?.date ?? petEvents[0]?.date ?? new Date().toISOString().slice(0, 10),
      end: lastEvidence?.date ?? petEvents.at(-1)?.date ?? new Date().toISOString().slice(0, 10),
    },
    status: "generated",
    responsibleAction: hasMeaningfulPattern
      ? "Continue monitoring the trend and consider discussing persistent changes with a veterinarian."
      : "Keep adding records so PeachyPawz can learn a more reliable baseline.",
    createdAt: new Date().toISOString(),
  };

  return {
    changes,
    baselines,
    primaryInsight,
    status: hasMeaningfulPattern ? "changes" : "stable",
    statusReason: hasMeaningfulPattern
      ? "Several meaningful deviations overlap in the available records."
      : "No significant deviations were detected in the available records.",
  };
}

export function metricSeries(events: HealthEvent[], petId: string, metric: "weight" | "activity") {
  return metricEvents(events.filter((event) => event.petId === petId), metric)
    .filter((event) => typeof event.data.value === "number")
    .map((event) => {
      const raw = event.data.value as number;
      const value = metric === "weight" ? normalizeWeight(raw, event.data.unit as string | undefined).value : raw;
      return { id: event.id, date: event.date, value: metric === "weight" ? displayWeightKg(value) : value };
    });
}

export function evidenceFor(events: HealthEvent[], ids: string[]) {
  return ids.map((id) => events.find((event) => event.id === id)).filter(Boolean) as HealthEvent[];
}
