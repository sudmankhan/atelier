// Keyword/topic retrieval. Implements the Retriever interface so a vector
// embedding retriever can replace it later without touching callers.
import type { AnyPartId } from "@/components/workshop/store";
import { KNOWLEDGE, type KnowledgeEntry } from "./library";

export interface RetrievalContext {
  partId?: AnyPartId | null;
  changedParams?: string[];
  typology?: "kangaroo" | "japanese";
}

export interface Retriever {
  retrieve(query: string, ctx?: RetrievalContext, k?: number): Promise<KnowledgeEntry[]>;
}

const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

export function scoreEntry(e: KnowledgeEntry, query: string, ctx: RetrievalContext = {}) {
  const q = query.toLowerCase();
  const tokens = tokenize(query);
  let score = 0;
  for (const kw of e.keywords) {
    if (kw.includes(" ") ? q.includes(kw) : tokens.some((t) => t.startsWith(kw) || kw.startsWith(t))) score += 3;
  }
  const hay = `${e.topic} ${e.principle} ${e.explanation}`.toLowerCase();
  for (const t of tokens) if (hay.includes(t)) score += 1;
  if (ctx.partId && e.parts.includes(ctx.partId)) score += 2;
  for (const p of ctx.changedParams ?? []) if (e.params.includes(p)) score += 2;
  if (ctx.typology && e.chairs?.includes(ctx.typology)) score += 2;
  return score;
}

export function retrieveSync(query: string, ctx: RetrievalContext = {}, k = 3): KnowledgeEntry[] {
  return KNOWLEDGE.map((e) => ({ e, s: scoreEntry(e, query, ctx) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.e);
}

export const keywordRetriever: Retriever = {
  retrieve: async (query, ctx, k) => retrieveSync(query, ctx, k),
};
