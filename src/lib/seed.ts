import { HealthEvent, Pet } from "./types";

export const DEMO_ANCHOR_DATE = "2026-08-23";

export const pets: Pet[] = [
  {
    id: "max",
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    birthDate: "2022-04-12",
    sex: "Male",
    color: "#E9A45D",
  },
  {
    id: "luna",
    name: "Luna",
    species: "Cat",
    breed: "Domestic Shorthair",
    birthDate: "2024-01-08",
    sex: "Female",
    color: "#8F9ED8",
  },
];

const e = (
  id: string,
  petId: string,
  type: HealthEvent["type"],
  date: string,
  title: string,
  summary: string,
  data: HealthEvent["data"],
  source: HealthEvent["source"] = "manual",
  sourceLabel?: string,
): HealthEvent => ({
  id,
  petId,
  type,
  date,
  title,
  summary,
  data,
  source,
  sourceLabel,
  confidence: source === "document_ai" ? "high" : undefined,
  reviewStatus: "approved",
  createdAt: `${date}T09:00:00.000Z`,
  updatedAt: `${date}T09:00:00.000Z`,
});

export const seedEvents: HealthEvent[] = [
  e("w01", "max", "weight", "2026-05-26", "Weight recorded", "18.1 kg", { value: 18.1, unit: "kg" }, "vet", "Oak & Paw Clinic"),
  e("a01", "max", "activity", "2026-05-28", "Activity", "82 min/day", { value: 82, unit: "min/day" }, "device", "Demo activity tracker"),
  e("a02", "max", "activity", "2026-06-04", "Activity", "84 min/day", { value: 84, unit: "min/day" }, "device", "Demo activity tracker"),
  e("w02", "max", "weight", "2026-06-08", "Weight recorded", "18.2 kg", { value: 18.2, unit: "kg" }),
  e("a03", "max", "activity", "2026-06-11", "Activity", "80 min/day", { value: 80, unit: "min/day" }, "device", "Demo activity tracker"),
  e("a04", "max", "activity", "2026-06-18", "Activity", "83 min/day", { value: 83, unit: "min/day" }, "device", "Demo activity tracker"),
  e("w03", "max", "weight", "2026-06-22", "Weight recorded", "18.3 kg", { value: 18.3, unit: "kg" }),
  e("ap01", "max", "appetite", "2026-06-26", "Appetite", "Normal", { state: "Normal" }),
  e("d01", "max", "diet", "2026-06-29", "Diet changed", "Switched to salmon & rice formula", { from: "Chicken adult formula", to: "Salmon & rice formula" }),
  e("a05", "max", "activity", "2026-07-02", "Activity", "78 min/day", { value: 78, unit: "min/day" }, "device", "Demo activity tracker"),
  e("w04", "max", "weight", "2026-07-06", "Weight recorded", "18.5 kg", { value: 18.5, unit: "kg" }),
  e("a06", "max", "activity", "2026-07-09", "Activity", "74 min/day", { value: 74, unit: "min/day" }, "device", "Demo activity tracker"),
  e("m01", "max", "medication", "2026-07-11", "Medication course ended", "Ear drops course completed as recorded", { medication: "Otic drops", action: "ended", endDate: "2026-07-11" }, "vet", "Oak & Paw Clinic"),
  e("a07", "max", "activity", "2026-07-16", "Activity", "71 min/day", { value: 71, unit: "min/day" }, "device", "Demo activity tracker"),
  e("w05", "max", "weight", "2026-07-20", "Weight recorded", "18.8 kg", { value: 18.8, unit: "kg" }),
  e("a08", "max", "activity", "2026-07-23", "Activity", "68 min/day", { value: 68, unit: "min/day" }, "device", "Demo activity tracker"),
  e("s01", "max", "symptom", "2026-07-28", "Owner observation", "Less interested in the evening walk", { symptom: "reduced walk interest", severity: "mild" }),
  e("a09", "max", "activity", "2026-07-30", "Activity", "66 min/day", { value: 66, unit: "min/day" }, "device", "Demo activity tracker"),
  e("w06", "max", "weight", "2026-08-03", "Weight recorded", "19.0 kg", { value: 19.0, unit: "kg" }),
  e("a10", "max", "activity", "2026-08-06", "Activity", "64 min/day", { value: 64, unit: "min/day" }, "device", "Demo activity tracker"),
  e("ap02", "max", "appetite", "2026-08-09", "Appetite changed", "Reduced", { state: "Reduced" }),
  e("s02", "max", "symptom", "2026-08-10", "Owner observation", "Moved more slowly on stairs", { symptom: "slower on stairs", severity: "mild" }),
  e("a11", "max", "activity", "2026-08-13", "Activity", "63 min/day", { value: 63, unit: "min/day" }, "device", "Demo activity tracker"),
  e("w07", "max", "weight", "2026-08-16", "Weight recorded", "19.4 kg", { value: 19.4, unit: "kg" }),
  e("v01", "max", "vet", "2026-08-18", "Vet visit", "Discussed recent activity, appetite and weight changes; monitoring was recorded as the next step.", { clinic: "Oak & Paw Clinic", reason: "Routine review", followUp: "Track activity and appetite for 2 weeks" }, "vet", "Oak & Paw Clinic"),
  e("a12", "max", "activity", "2026-08-20", "Activity", "63 min/day", { value: 63, unit: "min/day" }, "device", "Demo activity tracker"),
  e("vac01", "max", "vaccine", "2026-09-10", "Vaccination due", "Annual booster due", { vaccine: "Annual booster", status: "upcoming" }, "vet", "Oak & Paw Clinic"),

  e("l01", "luna", "weight", "2026-08-02", "Weight recorded", "4.2 kg", { value: 4.2, unit: "kg" }),
  e("l02", "luna", "note", "2026-08-15", "Routine note", "Playful and eating normally", { note: "Playful and eating normally" }),
];
