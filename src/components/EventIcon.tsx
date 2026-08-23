import {
  Activity,
  Apple,
  FileText,
  HeartPulse,
  NotebookPen,
  Pill,
  Scale,
  ShieldCheck,
  Stethoscope,
  Syringe,
  TestTube2,
} from "lucide-react";
import { EventType } from "@/lib/types";

const icons = {
  weight: Scale,
  activity: Activity,
  appetite: Apple,
  diet: Apple,
  symptom: HeartPulse,
  medication: Pill,
  vaccine: Syringe,
  vet: Stethoscope,
  lab: TestTube2,
  note: NotebookPen,
  document: FileText,
} satisfies Record<EventType, typeof Scale>;

export function EventIcon({ type, size = 18 }: { type: EventType; size?: number }) {
  const Icon = icons[type] || ShieldCheck;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
