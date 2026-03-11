# FormKiller — Technical Reference

## Project Overview

FormKiller is a multi-modal form builder with AI-powered question generation, voice input/output, and lead capture. Users create questionnaires via instructions; the app generates questions with default answers (AI), records voice answers (STT), reads questions aloud (TTS), and captures lead data at the end.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Auth + DB | Supabase (PostgreSQL via SSR) |
| ORM | Drizzle ORM |
| Validation | Zod 4 |
| Server Actions | next-safe-action v8 |
| UI | shadcn/ui + Radix UI + Tailwind CSS v4 |
| Forms | react-hook-form + @hookform/resolvers |
| Tables | TanStack React Table v8 |
| AI (generation) | Vercel AI SDK + OpenAI (gpt-4o-mini) |
| TTS | ElevenLabs (eleven_multilingual_v2) |
| STT | Deepgram (nova-3) |
| Storage | Cloudflare R2 via @aws-sdk/client-s3 |
| Toasts | Sonner |
| i18n | next-intl |
| Package Manager | pnpm |

---

## Folder Structure

```
/
├── app/                          # Next.js App Router
│   ├── auth/login/               # Login page
│   ├── dashboard/                # Authenticated dashboard
│   │   ├── __components/         # Dashboard-scoped components
│   │   ├── forms/[formId]/       # Form detail page
│   │   └── leads/                # Leads list page
│   ├── form/[formId]/            # Public form viewer
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/ui/                # shadcn UI components (never edit directly)
├── features/                     # Feature modules
│   ├── forms/
│   │   ├── components/
│   │   │   └── form-viewer/      # Public viewer UI
│   │   ├── actions.ts            # Authenticated server actions
│   │   ├── public-actions.ts     # Unauthenticated server actions
│   │   ├── queries.ts            # Supabase queries (feature-level)
│   │   ├── schema.ts             # Zod schemas + labels
│   │   └── types.ts              # Derived TypeScript types
│   └── leads/
│       ├── actions.ts
│       ├── queries.ts
│       └── schema.ts
├── lib/
│   ├── actions/index.ts          # Safe action clients (public + authenticated)
│   ├── ai/                       # OpenAI form generation
│   ├── db/schema.ts              # Drizzle ORM schema (source of truth)
│   ├── deepgram/functions.ts     # STT transcription
│   ├── elevenlabs/functions.ts   # TTS generation
│   ├── queries/index.ts          # publicQuery / authenticatedQuery helpers
│   ├── r2/                       # Cloudflare R2 CRUD
│   ├── supabase/                 # Supabase clients (server, client, admin)
│   ├── urls.ts                   # Route definitions
│   └── utils.ts                  # cn() and misc
├── hooks/                        # Custom React hooks
└── messages/                     # i18n translation files
```

### Naming Conventions

- **Component files:** kebab-case (`edit-questions-form.tsx`)
- **Page-scoped components:** in `__components/` subfolder within the route
- **Feature components:** `features/{feature}/components/`
- **Server actions:** `features/{feature}/actions.ts` (authenticated), `features/{feature}/public-actions.ts` (public)
- **DB queries:** `features/{feature}/queries.ts` (feature-level) or `lib/queries/index.ts` (helpers)
- **Zod schemas + TS types:** colocated in `features/{feature}/schema.ts`
- **Derived types:** `features/{feature}/types.ts` using `Awaited<ReturnType<...>>`

---

## Database Schema (Drizzle ORM)

**File:** `lib/db/schema.ts`

After schema changes, run:
```bash
pnpm db:generate   # generates migration
pnpm db:migrate    # applies + regenerates supabase types
```

### Enums

```ts
formTypeEnum: "mixed" | "default-only" | "voice-only"
formLanguageEnum: "en" | "it" | "es"
formSessionStatusEnum: "pending" | "in_progress" | "completed"
```

### Tables

| Table | Key Columns |
|---|---|
| `form` | id, userId, name, instructions, type, language |
| `question` | id, userId, formId, order, question, defaultAnswers (jsonb), fileKey, fileGeneratedAt |
| `form_session` | id, userId, formId, status, currentQuestionIndex |
| `answer` | id, userId, formId, formSessionId, questionId, defaultAnswer, fileKey, stt |
| `lead` | id, userId, formId, formSessionId, name, email, phone, notes |

All tables have `created_at` and `updated_at` timestamps. All relationships cascade delete on user deletion.

`defaultAnswers` in `question` is `jsonb` typed as `GenerateFormType` (the AI output format).

---

## Server Actions Pattern (next-safe-action v8)

**Client definitions:** `lib/actions/index.ts`

```ts
// Unauthenticated
export const publicActionClient = baseActionClient.use(...)

// Authenticated — injects { supabase, userId } into ctx
export const authenticatedActionClient = publicActionClient.use(...)
```

**Usage:**
```ts
export const myAction = authenticatedActionClient
  .inputSchema(myZodSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, userId } = ctx;
    // ...
    return result;
  });
```

**Public actions** (no auth): use `publicViewerClient` (defined locally in `public-actions.ts`) with `supabaseAdmin`.

**Calling from client:**
```ts
const { data, serverError } = await myAction(input);
if (serverError || !data) throw new Error();
```

---

## Query Helpers

**File:** `lib/queries/index.ts`

```ts
// Server component — provides { supabase }
await publicQuery(async ({ supabase }) => { ... });

// Server component — provides { supabase, userId } via getClaims()
await authenticatedQuery(async ({ supabase, userId }) => { ... });
```

Use these in Server Components (pages). Use feature-level `queries.ts` for the actual Supabase calls.

---

## Authentication

- Supabase SSR via `@supabase/ssr`
- Server client: `lib/supabase/server.ts` → `createClient()`
- Admin client: `lib/supabase/admin.ts` → `supabaseAdmin` (bypasses RLS)
- Get user ID: `supabase.auth.getClaims()` → `data.claims.sub`
- Public pages (form viewer) use `supabaseAdmin` directly

---

## Audio Pipeline

### TTS (Text-to-Speech)
- **Trigger:** `generateQuestionTTSAction` (per question) or bulk on form create
- **API:** ElevenLabs `eleven_multilingual_v2` model
- **Storage:** `tts/{formId}/{timestamp}.mp3` in Cloudflare R2
- **DB:** stores `fileKey` on `question` row
- **Playback:** `getFileUrl(fileKey)` returns public URL (no signing needed)

### STT (Speech-to-Text)
- **Trigger:** on `submitAnswerAction` when `audioBase64` is present
- **API:** `deepgram.listen.v1.media.transcribeFile` (nova-3 model) — NOT `.prerecorded`
- **Storage:** `stt/{formId}/{sessionId}/{timestamp}.webm` in Cloudflare R2
- **DB:** stores `stt` (transcript) + `fileKey` on `answer` row

### Recording (Browser)
- Uses `MediaRecorder` API
- `blobToBase64` via `FileReader` (browser-native, no Node.js buffer)
- Sends `audioBase64` + `audioMimeType` to server action

---

## Cloudflare R2

**Files:** `lib/r2/index.ts`, `lib/r2/functions.ts`

```ts
uploadFile({ key, body, contentType })  // returns public URL
deleteFile(key)
getFileUrl(key)   // ${R2_PUBLIC_URL}/${key} — no signed URLs
listFiles(prefix?)
```

File key format: `{type}/{formId}/{...}/{timestamp}.{ext}`

---

## AI Form Generation

**File:** `lib/ai/functions.ts`

- Model: OpenAI `gpt-4o-mini`
- Input: `{ instructions, language }`
- Output: 5-10 questions, each with 4 default answers
- Schema enforced via Vercel AI SDK `generateObject`

---

## Public Form Viewer

**File:** `features/forms/components/form-viewer/index.tsx`

Phase state machine: `welcome → question → lead-form → completed`

- `useTypewriter(text, speed)` — animated subtitle effect
- TTS autoplay: `new Audio(url)` on question change
- `showDefaultAnswers`: hidden when `form.type === "voice-only"`
- `showRecording`: hidden when `form.type === "default-only"`
- Answer state: `{ type: "default", text }` | `{ type: "custom", blob }`

**Public page:** `app/form/[formId]/page.tsx`
- Server Component using `publicQuery`
- Pre-computes `audioUrl` via `getFileUrl` (server-side, uses private env var)
- Passes `ViewerFormData` to `<FormViewer>`

---

## Zod Schemas

**Forms:** `features/forms/schema.ts`
- `createFormSchema`: name, instructions, type, language
- `editFormSchema`: formId, name, instructions, type (NO language — not editable after creation)
- `editQuestionsSchema`: formId, language, questions[]
- `generateQuestionTTSSchema`: questionId, formId, language

**Leads:** `features/leads/schema.ts`
- `createLeadSchema`: name (min 2), email, phone (regex), notes (optional), formId, sessionId, userId
- Italian validation messages (`"Inserisci un indirizzo email valido"`, etc.)

---

## Routing

**File:** `lib/urls.ts`

```ts
urls.dashboard.forms.list()
urls.dashboard.forms.detail(formId)
urls.form(formId)           // public viewer
```

---

## Styling

- Tailwind CSS v4 with CSS variables
- Fonts: **Roboto** (headings, `font-black`) + **Open Sans** (body)
- Font CSS variables MUST be on `<html>` element, not `<body>`
- `globals.css`: `--font-sans: var(--font-open-sans)`, `--font-roboto: var(--font-roboto)`
- `h1, h2, h3 { @apply font-roboto font-black; }`
- shadcn components: never edit `components/ui/` directly, use `pnpm ui:add`

---

## Environment Variables

```env
DATABASE_URL=""
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
SUPABASE_SECRET_KEY=""
OPENAI_API_KEY=""
DEEPGRAM_API_KEY=""
ELEVENLABS_API_KEY=""
ELEVENLABS_DEFAULT_VOICE_ID=""
CLOUDFLARE_R2_ACCOUNT_ID=""
CLOUDFLARE_R2_ACCESS_KEY_ID=""
CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
CLOUDFLARE_R2_BUCKET=""
CLOUDFLARE_R2_PUBLIC_URL=""
```

`R2_PUBLIC_URL` and `SUPABASE_SECRET_KEY` are server-only (no `NEXT_PUBLIC_` prefix).

---

## Common Pitfalls

- **`dotenv` scripts:** use `dotenv -e .env.local --` (not `-f`, not `run`)
- **`supabase.auth.getClaims()`**: returns `{ data: { claims: { sub: userId } }, error }`
- **Deepgram STT:** use `deepgram.listen.v1.media.transcribeFile` — NOT `.prerecorded.transcribeFile`
- **R2 public URLs:** no signing — just `${R2_PUBLIC_URL}/${key}`
- **next-safe-action v8 API:** `inputSchema(schema).action(...)` — NOT `.schema()` or `.define()`
- **Language not editable:** `editFormSchema` intentionally excludes `language`
- **Question order:** always use `.order("order", { referencedTable: "question", ascending: true })` in queries
- **TTS regeneration:** `editQuestionsAction` only regenerates TTS for questions whose text actually changed (diff check)
- **RHF field IDs vs DB IDs:** `field.id` in `useFieldArray` is RHF's internal ID — use the original data array for DB UUIDs

---

## TypeScript Path Alias

`@/` maps to the project root (`./`). Example: `import { foo } from "@/lib/utils"`.

---

## After Every Round of Changes

After completing any set of code modifications, always run:

```bash
pnpm lint && pnpm build
```

- If **lint** fails: fix all ESLint errors before proceeding. Do not disable rules unless explicitly asked.
- If **build** fails: fix all TypeScript and compilation errors before considering the task done.
- Never leave the codebase in a broken build or lint state.
