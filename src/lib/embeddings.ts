import { getOpenAIClient } from "./llm";

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  if (texts.length === 0) return null;
  try {
    const client = getOpenAIClient();
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  } catch {
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}
