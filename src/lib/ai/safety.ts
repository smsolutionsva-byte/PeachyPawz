const banned = [
  /your pet (has|definitely has|is suffering from)/i,
  /stop (the )?medication/i,
  /increase (the )?dose/i,
  /decrease (the )?dose/i,
  /start taking/i,
  /guaranteed/i,
];

export function sanitizeMedicalLanguage(text: string) {
  let output = text;
  for (const pattern of banned) {
    if (pattern.test(output)) {
      output = "The available records show a change that may be worth discussing with a veterinarian. PeachyPawz does not diagnose conditions or change treatment plans.";
      break;
    }
  }
  return output;
}

export function emergencyGuard(question: string) {
  const urgent = /(can't breathe|cannot breathe|difficulty breathing|seizure|collapsed|unconscious|severe bleeding|poison|toxin|chocolate.*large|xylitol)/i.test(question);
  if (!urgent) return null;
  return "This description could require prompt veterinary attention. Consider contacting a veterinarian or emergency veterinary service now. PeachyPawz cannot diagnose the cause from chat.";
}
