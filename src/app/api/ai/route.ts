import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { answerQuestion, generateStory, generateVetBrief } from "@/lib/ai/service";
import { ChatTurn, HealthEvent, Pet } from "@/lib/types";

const schema = z.object({
  mode: z.enum(["story", "chat", "vet"]),
  pet: z.custom<Pet>(),
  events: z.array(z.custom<HealthEvent>()).max(500),
  question: z.string().max(1000).optional(),
  allowAI: z.boolean().optional().default(false),
  history: z.array(z.custom<ChatTurn>()).max(120).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = schema.parse(await request.json());
    const petEvents = body.events.filter((event) => event.petId === body.pet.id);
    if (body.mode === "story") return NextResponse.json(await generateStory(body.pet, petEvents, body.allowAI));
    if (body.mode === "vet") return NextResponse.json(generateVetBrief(body.pet, petEvents));
    return NextResponse.json(await answerQuestion(body.pet, petEvents, body.question || "Summarize recent changes.", body.allowAI, body.history));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
