# AI, APIs and external services

## Summary
| Feature | Server function | Service | Model | Required secret |
|---|---|---|---|---|
| Mentor chat | `askMaster` (`src/lib/mentor.functions.ts`) | Lovable AI Gateway | `google/gemini-3.8-flash` | `LOVABLE_API_KEY` (auto-provided by Lovable) |
| Lumber photo inspection | `inspectLumber` (`src/lib/lumber.functions.ts`) | Lovable AI Gateway (vision) | `google/gemini-3.8-flash` | same |
| Voice narration (optional) | `voiceStatus`, `speakMaster` | ElevenLabs TTS REST | `eleven_multilingual_v2` | `ELEVENLABS_API_KEY`, optional `ELEVENLABS_VOICE_ID` (default `JBFqnCBsd6RMkjVDRZzb`) |

No other external APIs. No Supabase/database. No Wikipedia/YouTube calls or links.

The Gateway SDK is `@lovable.dev/ai-gateway` → `generateChatCompletion({ model, messages })`, OpenAI-style messages, errors as `GatewayError` with `code` (`payment_required`, `rate_limited`, …). It is imported dynamically inside handlers. If you run outside Lovable you must supply a gateway key or replace this call with a direct Gemini client; keep the same input/output shapes.

## 1. Mentor — RAG pipeline (`askMaster`)
Input (`MentorInput`): `question` (≤1200 chars), `history` (last 8 turns), `context`:
`typology, section, partName, lesson, params, changed[], observations[]`.
`observations` are the deterministic facts computed in the browser — geometry from the consequence engine, plus `[CALCULATED]` joint stress, tipping and movement lines and their `[ASSUMPTION]` loads from `src/lib/chair/calculated.ts`. The model must treat them as authoritative and quote numbers only from them. `[HEURISTIC]` lines are craft rules of thumb. `mentor/claims.ts` adds `[LIMITATION]` facts for capacity/safety/bending questions and flags overclaims and numbers not in the context.

Steps:
1. **Retrieve**: `retrieveSync(question, { changedParams, typology }, 4)` from `src/lib/knowledge/retrieve.ts`. It is *keyword scoring* (`scoreEntry`) over `KNOWLEDGE` entries in `library.ts` (topic, principle, explanation, tags, typology/part/param boosts). Not vector embeddings. The `Retriever` interface allows swapping in embeddings later.
2. **Prompt**: system prompt = "the Master" persona: explain mechanically what the change does (lever arms, racking, grain, joint angles, span) and for the sitter, say good/bad and why, give next adjustment + trade-off, end with one question. Use computed numbers exactly, cite excerpts by title only, never invent sources/URLs, never claim safety, plain prose <200 words, no markdown.
   Second system message: CONTEXT block + REFERENCE EXCERPTS `[n] title / topic / principle explanation`.
3. **Call** Gemini with history + question.
4. **Post-process**: strip `*`, return `{ ok, answer, sources: [{title,url}] }` (url is empty now; UI shows titles only and opens the in-app Library).
5. **Errors** mapped to friendly messages (credits exhausted / busy / generic). Never throws to UI.

To make the mentor less generic: add more entries to `library.ts` (principle + explanation + tags + typology/part/param), and add more deterministic observations to the consequence engines. The model only knows what these two give it.

## 2. Lumber Inspector — vision (`inspectLumber`)
Input: `image` data URL (jpeg/png/webp, ≤6 MB string), `board {l,w,t}` cm, `typology`, `parts[]` (cut-list names, ≤20).
Prompt: strict chairmaker inspecting a photo; estimate species, cut (flat/quarter/rift/unknown), grain slope "1 in N" (null if not visible), defects; assign `bestFor`/`avoidFor` **only from the given parts**; apply 1:12 rule to loaded long parts; never claim safe; advice <70 words; reply ONLY JSON.
Message content = `[ {type:"text"}, {type:"image_url", image_url:{url}} ]`.
Post-process: slice first `{`..last `}`, JSON.parse, sanitize every field, filter part names against the allowed set, clamp confidence. Returns `{ ok, report: LumberReport | null, error }`.
The model returns a descriptive `grain` look (`straight | moderate | steep`), shown as an "AI estimate". It is never converted into a number or written into the board; grain slope for the matcher is only what the user types.

## 3. ElevenLabs voice
`voiceStatus` (GET) → `{configured}`. `speakMaster` (POST `{text≤1500}`) → fetch `https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128`, returns base64 mp3. UI hides voice when not configured.

## Rules for any LLM modifying AI code
- Keep calls in `createServerFn` handlers; read secrets via `process.env[...]` inside handlers only.
- Never let the model invent numbers, sources or URLs; numbers come from `src/lib/chair/*`.
- The mentor and lumber inspector are the only AI surfaces. Everything else works with AI turned off.

## Lumber photo inspection — suitability gate (updated)
- Server fn `inspectLumber` (src/lib/lumber.functions.ts) uses `.validator()` (the `.inputValidator()` name is deprecated in the installed @tanstack/start-client-core).
- Input checks are deterministic (`validateImageDataUrl` in src/lib/lumberReport.ts): JPEG/PNG/WebP data URL, non-empty, size cap.
- The model must first classify the image: usable / insufficient_detail / synthetic_or_non_wood / uncertain.
- `parseLumberReport` validates the reply with zod. Anything not "usable", or malformed, becomes an abstention with photo tips and no grain number or part advice. No grain reading → no "good for" parts.
- Model confidence is shown as the model's own label, never as a probability; no confidence threshold is applied (no calibration data).
- The grain look is never written to the board; there is no "apply" button.
- The suitability check is itself model-based and can be wrong.
