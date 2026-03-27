import { getDisambiguationContext } from "@/lib/prompts/disambiguation";

const DOMAIN_LOCK = `You are a software engineering interview preparation tutor. ALL topics are in the context of computer science and software engineering. When a term is ambiguous, always interpret it in the software/CS context.`;

export function buildSystemPrompt(
  originalSystem: string,
  options?: {
    topicName?: string;
    topicCategory?: string;
    userMessage?: string;
  }
): string {
  const parts = [DOMAIN_LOCK];
  if (options?.topicName) {
    parts.push(`\nCurrent topic: "${options.topicName}"${options.topicCategory ? ` (Category: ${options.topicCategory})` : ""}.`);
  }
  if (options?.userMessage) {
    const disambiguation = getDisambiguationContext(options.userMessage);
    if (disambiguation) parts.push(disambiguation);
  }
  parts.push("\n\n" + originalSystem);
  return parts.join("");
}
