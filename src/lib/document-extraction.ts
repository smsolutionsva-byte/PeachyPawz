import { z } from "zod";

export const extractionSchema = z.object({
  petName: z.string().nullable().default(null),
  documentType: z.enum(["vet_visit", "vaccination", "medication", "lab", "unknown"]).default("unknown"),
  date: z.string().nullable().default(null),
  clinic: z.string().nullable().default(null),
  weight: z.object({ value: z.number(), unit: z.enum(["kg", "lb"]) }).nullable().default(null),
  medications: z.array(z.object({ name: z.string(), dose: z.string().nullable().default(null), frequency: z.string().nullable().default(null) })).default([]),
  followUp: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  confidence: z.enum(["high", "moderate", "limited"]).default("limited"),
  warnings: z.array(z.string()).default([]),
});

export type DocumentExtraction = z.infer<typeof extractionSchema>;

export function heuristicExtract(text: string): DocumentExtraction {
  const raw = text.replace(/\r/g, "").trim();
  const clean = raw.replace(/\s+/g, " ").trim();
  const lineValue = (label: string) => raw.match(new RegExp(`^${label}\\s*[:\\-]\\s*(.+)$`, "im"))?.[1]?.trim() ?? null;
  const pet = lineValue("(?:pet|patient|name)")?.match(/^([A-Za-z][A-Za-z '-]{0,40})/)?.[1]?.trim() ?? null;
  const dateText = lineValue("(?:date|visit date)");
  const dateMatch = dateText?.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/);
  const weightText = lineValue("(?:weight|wt)") ?? clean;
  const weightMatch = weightText.match(/(?:weight|wt)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(kg|kgs|lb|lbs)/i);
  const clinic = lineValue("(?:clinic|hospital|practice)");
  const follow = lineValue("(?:follow[- ]?up|plan)");
  const med = lineValue("(?:medication|medicine|rx)");

  const normalizedDate = dateMatch?.[1]
    ? dateMatch[1].includes("-") && dateMatch[1].split("-")[0].length === 4
      ? dateMatch[1]
      : null
    : null;

  return extractionSchema.parse({
    petName: pet,
    documentType: /vaccin/i.test(clean) ? "vaccination" : /lab|blood|cbc/i.test(clean) ? "lab" : "vet_visit",
    date: normalizedDate,
    clinic,
    weight: weightMatch ? { value: Number(weightMatch[1]), unit: /lb/i.test(weightMatch[2]) ? "lb" : "kg" } : null,
    medications: med ? [{ name: med, dose: null, frequency: null }] : [],
    followUp: follow,
    notes: clean.slice(0, 320) || null,
    confidence: weightMatch && pet ? "moderate" : "limited",
    warnings: [
      ...(normalizedDate ? [] : ["Visit date needs review." ]),
      ...(pet ? [] : ["Pet identity could not be confirmed from the document." ]),
    ],
  });
}
