# FormKiller — AGENTS Essentials

## Scope

Guida minima per lavorare nel repo senza regressioni.

## Stack (solo ciò che guida le scelte)

- Next.js 16 (App Router), TypeScript, pnpm
- Supabase + Drizzle ORM
- next-safe-action v8
- Zod 4 + react-hook-form
- next-intl
- Tailwind v4 + shadcn/ui

## Struttura da rispettare

- `app/`: route e page components
- `features/<feature>/`: per ogni macrofeature
  - `features/<feature>/components`: componenti
  - `features/<feature>/schema.ts`: schema centralizzati
  - `features/<feature>/types.ts`: tipi centralizzati
  - `features/<feature>/actions.ts`: server actions
  - `features/<feature>/queries.ts`: query di feature
- `components/ui/`: non modificare direttamente

## Regole non negoziabili

- i18n:
  - Usa sempre `useTranslations()` e `getTranslations()`.
  - Usa sempre chiavi assolute: `t("dashboard.name")`, non scope locali.
- Forms:
  - Nella feature `features/forms`, centralizza schema e tipi in `features/forms/schema.ts` e `features/forms/types.ts`.
  - Non creare wrapper schema per traduzioni Zod (es. `makeXSchema`).
  - Usa Zod locales (`z.config(...)`) per localizzare i messaggi.
- Auth/RBAC:
  - Ruoli applicativi in tabella `account` con enum `admin | user`.
  - Usa `authenticatedActionClient` / `authenticatedQuery` per operazioni utente autenticate.
  - Usa `adminActionClient` / `adminQuery` per operazioni solo admin.
- UI:
  - Non usare colori hardcoded tipo `text-white`, `bg-black`, ecc. nei nuovi componenti.
  - Usa token semantici (`text-foreground`, `bg-card`, `border-border`, ecc.).
- R2:
  - `getFileUrl` è server-only. Mai in client component.
- Form logic:
  - `editFormSchema` non deve permettere modifica `language`.
  - Ordinamento domande: sempre `.order("order", { referencedTable: "question", ascending: true })`.

## Pattern tecnici obbligatori

- Server actions (`next-safe-action`):
  - `inputSchema(schema).action(async ({ parsedInput, ctx }) => { ... })`
  - Per flussi admin, base client: `adminActionClient`.
- Query server components:
  - `publicQuery(...)` / `authenticatedQuery(...)`
  - Per query admin, usa `adminQuery(...)`.
- STT Deepgram:
  - Usa `deepgram.listen.v1.media.transcribeFile` (non `.prerecorded`)

## Comandi obbligatori dopo ogni modifica

```bash
pnpm lint && pnpm build
```

- Non lasciare errori ESLint o TypeScript/build.

## Se modifichi DB schema (`lib/db/schema.ts`)

Ricorda sempre all'utente, nella stessa risposta finale:

```bash
pnpm db:generate
pnpm db:migrate
```

## Alias

- `@/` punta alla root progetto (`./`).
