export type Pet = {
  id: string;
  name: string;
  species: "Dog" | "Cat";
  breed: string;
  birthDate: string;
  sex: "Male" | "Female";
  color: string;
};

export type EventType =
  | "weight"
  | "activity"
  | "appetite"
  | "diet"
  | "symptom"
  | "medication"
  | "vaccine"
  | "vet"
  | "lab"
  | "note"
  | "document";

export type SourceType = "manual" | "document_ai" | "vet" | "device" | "imported";

export type HealthEvent = {
  id: string;
  petId: string;
  type: EventType;
  date: string;
  title: string;
  summary: string;
  data: Record<string, string | number | boolean | null>;
  source: SourceType;
  sourceLabel?: string;
  sourceDocumentId?: string | null;
  confidence?: "high" | "moderate" | "limited";
  reviewStatus: "approved" | "pending" | "corrected";
  createdAt: string;
  updatedAt: string;
};

export type MetricChange = {
  metric: "weight" | "activity" | "appetite";
  label: string;
  from: string;
  to: string;
  changePercent?: number;
  direction: "up" | "down" | "changed" | "stable";
  evidenceIds: string[];
};

export type Baseline = {
  metric: "weight" | "activity";
  state: "insufficient" | "emerging" | "reliable";
  sampleCount: number;
  min: number | null;
  max: number | null;
  average: number | null;
  unit: string;
  explanation: string;
};

export type Insight = {
  id: string;
  title: string;
  summary: string;
  confidence: "High confidence" | "Moderate confidence" | "Limited evidence";
  evidenceIds: string[];
  timeRange: { start: string; end: string };
  status: "generated" | "stale" | "dismissed";
  responsibleAction: string;
  createdAt: string;
};

export type AnalyticsResult = {
  changes: MetricChange[];
  baselines: Baseline[];
  primaryInsight: Insight;
  status: "stable" | "changes" | "attention";
  statusReason: string;
};

export type ChatAnswer = {
  scope: "pet-records" | "general";
  answer: string;
  evidenceIds: string[];
  caution?: string;
};
