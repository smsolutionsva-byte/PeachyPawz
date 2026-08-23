import { AnalyticsResult, Baseline, HealthEvent, Insight, MetricChange } from "./types";

const byDate = (a: HealthEvent, b: HealthEvent) => a.date.localeCompare(b.date);
const metricEvents = (events: HealthEvent[], type: HealthEvent["type"]) =>
  events.filter((event) => event.type === type).sort(byDate);

const pct = (from: number, to: number) => ((to - from) / from) * 100;
const round1 = (value: number) => Math.round(value * 10) / 10;

export function calculateBaseline(events: HealthEvent[], metric: "weight" | "activity"): Baseline {
  const items = metricEvents(events, metric).filter((event) => typeof event.data.value === "number");
  const baselineItems = items.slice(0, Math.min(metric === "activity" ? 4 : 3, items.length));
  const values = baselineItems.map((item) => item.data.value as number);
  const unit = (baselineItems[0]?.data.unit as string) || (metric === "weight" ? "kg" : "min/day");

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
        ? `Based on ${values.length} early-period records in this 90-day demo window.`
        : `An emerging baseline based on ${values.length} records.`,
  };
}

function changeForNumericMetric(events: HealthEvent[], type: "weight" | "activity", label: string): MetricChange | null {
  const items = metricEvents(events, type).filter((event) => typeof event.data.value === "number");
  if (items.length < 2) return null;
  const first = items[0];
  const last = items[items.length - 1];
  const from = first.data.value as number;
  const to = last.data.value as number;
  const unit = (last.data.unit as string) || "";
  const change = round1(pct(from, to));
  return {
    metric: type,
    label,
    from: `${round1(from)} ${unit}`,
    to: `${round1(to)} ${unit}`,
    changePercent: change,
    direction: change > 1 ? "up" : change < -1 ? "down" : "stable",
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

  const primaryInsight: Insight = {
    id: "insight-activity-weight",
    title: hasMeaningfulPattern ? "Activity & weight changed together" : "Recent health pattern",
    summary: hasMeaningfulPattern
      ? `Weight increased ${Math.abs(weight?.changePercent ?? 0).toFixed(1)}% while activity decreased ${Math.abs(activity?.changePercent ?? 0).toFixed(1)}%. A diet change was recorded shortly before the sustained activity decline.`
      : "There is not enough evidence for a strong multi-metric pattern yet.",
    confidence: evidenceIds.length >= 6 ? "High confidence" : evidenceIds.length >= 3 ? "Moderate confidence" : "Limited evidence",
    evidenceIds,
    timeRange: {
      start: firstEvidence?.date ?? "2026-05-26",
      end: lastEvidence?.date ?? "2026-08-23",
    },
    status: "generated",
    responsibleAction: hasMeaningfulPattern
      ? "Continue monitoring the trend and consider discussing persistent changes with a veterinarian."
      : "Keep adding records so PeachyPawz can learn a more reliable baseline.",
    createdAt: "2026-08-23T08:00:00.000Z",
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
    .map((event) => ({ id: event.id, date: event.date, value: event.data.value as number }));
}

export function evidenceFor(events: HealthEvent[], ids: string[]) {
  return ids.map((id) => events.find((event) => event.id === id)).filter(Boolean) as HealthEvent[];
}
