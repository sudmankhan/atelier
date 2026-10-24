# AI, APIs and external services

## Summary

| Feature                    | Server function                                 | Service                         | Model                               | Required secret                                                                       |
| -------------------------- | ----------------------------------------------- | ------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| Mentor chat                | `askMaster` (`src/lib/mentor.functions.ts`)     | Google Gemini REST API          | `gemini-3.5-flash` by default       | `GEMINI_API_KEY`                                                                      |
| Lumber photo inspection    | `inspectLumber` (`src/lib/lumber.functions.ts`) | Google Gemini REST API (vision) | `gemini-3-flash-preview` by default | `GEMINI_API_KEY`                                                                      |
| Voice narration (optional) | `voiceStatus`, `speakMaster`                    | ElevenLabs TTS REST             | `eleven_multilingual_v2`            | `ELEVENLABS_API_KEY`, optional `ELEVENLABS_VOICE_ID` (default `JBFqnCBsd6RMkjVDRZzb`) |

No other external APIs. No Supabase/database. No Wikipedia/YouTube calls or links.

`src/lib/gemini.server.ts` calls Google's `generateContent` REST endpoint directly.
Set `GEMINI_MODEL` or `GEMINI_VISION_MODEL` to override the defaults. Requests time
out after 45 seconds, and configuration, rate-limit, timeout, and generic failures
are mapped to user-facing messages by the server functions.

## 1. Mentor — RAG pipeline (`askMaster`)

Input (`MentorInput`): `question` (≤1200 chars), `history` (last 8 turns), `context`:
`typology, section, partName, lesson, params, changed[], observations[]`.
`observations` are the deterministic facts computed in the browser by the consequence engine — the model must treat them as authoritative.

Steps:

1. **Retrieve**: `retrieveSync(question, { changedParams, typology }, 4)` from `src/lib/knowledge/retrieve.ts`. It is _keyword scoring_ (`scoreEntry`) over `KNOWLEDGE` entries in `library.ts` (topic, principle, explanation, tags, typology/part/param boosts). Not vector embeddings. The `Retriever` interface allows swapping in embeddings later.
2. **Prompt**: system prompt = "the Master" persona: explain mechanically what the change does (lever arms, racking, grain, joint angles, span) and for the sitter, say good/bad and why, give next adjustment + trade-off, end with one question. Use computed numbers exactly, cite excerpts by title only, never invent sources/URLs, never claim safety, plain prose <200 words, no markdown.
   The system instruction also contains the CONTEXT block + REFERENCE EXCERPTS `[n] title / topic / principle explanation`.
3. **Call** Gemini with history + question.
4. **Post-process**: strip `*`, return `{ ok, answer, sources: [{title,url}] }` (url is empty now; UI shows titles only and opens the in-app Library).
5. **Errors** mapped to friendly messages (not configured / busy / timeout / generic). Never throws to UI.

To make the mentor less generic: add more entries to `library.ts` (principle + explanation + tags + typology/part/param), and add more deterministic observations to the consequence engines. The model only knows what these two give it.

## 2. Lumber Inspector — vision (`inspectLumber`)

Input: `image` data URL (jpeg/png/webp, ≤6 MB string), `board {l,w,t}` cm, `typology`, `parts[]` (cut-list names, ≤20).
Prompt: strict chairmaker inspecting a photo; estimate species, cut (flat/quarter/rift/unknown), grain slope "1 in N" (null if not visible), defects; assign `bestFor`/`avoidFor` **only from the given parts**; apply 1:12 rule to loaded long parts; never claim safe; advice <70 words; reply ONLY JSON.
Message content uses Gemini text and inline base64 image parts.
Post-process: slice first `{`..last `}`, JSON.parse, sanitize every field, filter part names against the allowed set, clamp confidence. Returns `{ ok, report: LumberReport | null, error }`.
The returned `grainSlope` is fed into the deterministic `matchStock` — the AI only supplies an estimate; verdicts are computed by code.

## 3. ElevenLabs voice

`voiceStatus` (GET) → `{configured}`. `speakMaster` (POST `{text≤1500}`) → fetch `https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128`, returns base64 mp3. UI hides voice when not configured.

## Rules for any LLM modifying AI code

- Keep calls in `createServerFn` handlers; read secrets via `process.env[...]` inside handlers only.
- Never let the model invent numbers, sources or URLs; numbers come from `src/lib/chair/*`.
- The mentor and lumber inspector are the only AI surfaces. Everything else works with AI turned off.
