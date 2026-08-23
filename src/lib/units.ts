export function normalizeWeight(value: number, unit?: string | null) {
  const normalizedUnit = String(unit || "kg").trim().toLowerCase();
  if (normalizedUnit === "lb" || normalizedUnit === "lbs" || normalizedUnit === "pound" || normalizedUnit === "pounds") {
    return { value: value * 0.45359237, unit: "kg" as const };
  }
  return { value, unit: "kg" as const };
}

export function displayWeightKg(value: number) {
  return Math.round(value * 10) / 10;
}
