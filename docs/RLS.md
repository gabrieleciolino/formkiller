# RLS Design For FormKiller (Drizzle Syntax)

Documento orientato all'implementazione in `lib/db/schema.ts` con `drizzle-orm@0.45.1`.

## Assunzione di questo documento
Tutti i `form` sono pubblici per design.

Implica:
- `SELECT` pubblico su `form` e `question`.
- Nessun accesso pubblico a `account`, `asset`, `form_session`, `answer`, `lead`.
- Scritture pubbliche sempre mediate da backend con `service_role`.

## API Drizzle da usare

```ts
import { sql, type SQL } from "drizzle-orm";
import { pgPolicy, type AnyPgColumn } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
```

Su ogni tabella:
- policy nel terzo parametro di `pgTable(..., (t) => [ ... ])`
- `.enableRLS()`

## Helper expressions (riusabili)

```ts
const isAdminExpr = sql`
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
`;

const isOwnerExpr = (userIdCol: AnyPgColumn): SQL =>
  sql`${userIdCol} = auth.uid()`;

const isOwnerOrAdminExpr = (userIdCol: AnyPgColumn): SQL =>
  sql`${isOwnerExpr(userIdCol)} or ${isAdminExpr}`;

const ownsFormExpr = (formIdCol: AnyPgColumn): SQL => sql`
  exists (
    select 1
    from "form" f
    where f.id = ${formIdCol}
      and f.user_id = auth.uid()
  )
`;
```

## Policy per tabella (Drizzle)

## `account`
Perché:
- evitare escalation ruolo (`user` -> `admin`)
- supportare `adminActionClient` / `adminQuery`

```ts
export const accountTable = pgTable(
  "account",
  {
    // columns...
  },
  (t) => [
    pgPolicy("account_select_own_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("account_update_admin_only", {
      for: "update",
      to: authenticatedRole,
      using: isAdminExpr,
      withCheck: isAdminExpr,
    }),
    pgPolicy("account_delete_admin_only", {
      for: "delete",
      to: authenticatedRole,
      using: isAdminExpr,
    }),
  ],
).enableRLS();
```

Nota:
- nessuna policy `insert`: creazione via trigger/service flow.

## `asset`
Perché:
- libreria privata utente
- nessun requisito di public access

```ts
export const assetTable = pgTable(
  "asset",
  {
    // columns...
  },
  (t) => [
    pgPolicy("asset_select_owner_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("asset_insert_owner_or_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("asset_update_owner_or_admin", {
      for: "update",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
      withCheck: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("asset_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();
```

## `form`
Perché:
- tutti i form devono essere leggibili pubblicamente
- scrittura riservata owner/admin

```ts
export const formTable = pgTable(
  "form",
  {
    // columns...
  },
  (t) => [
    pgPolicy("form_select_public", {
      for: "select",
      to: "public",
      using: sql`true`,
    }),
    pgPolicy("form_insert_owner_or_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("form_update_owner_or_admin", {
      for: "update",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
      withCheck: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("form_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();
```

## `question`
Perché:
- domande pubbliche insieme al form
- scrittura riservata owner/admin
- su insert/update serve coerenza con owner del form

```ts
export const questionTable = pgTable(
  "question",
  {
    // columns...
  },
  (t) => [
    pgPolicy("question_select_public", {
      for: "select",
      to: "public",
      using: sql`exists (select 1 from "form" f where f.id = ${t.formId})`,
    }),
    pgPolicy("question_insert_owner_or_admin", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`
        ${isAdminExpr}
        or (
          ${isOwnerExpr(t.userId)}
          and ${ownsFormExpr(t.formId)}
        )
      `,
    }),
    pgPolicy("question_update_owner_or_admin", {
      for: "update",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
      withCheck: sql`
        ${isAdminExpr}
        or (
          ${isOwnerExpr(t.userId)}
          and ${ownsFormExpr(t.formId)}
        )
      `,
    }),
    pgPolicy("question_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();
```

## `form_session`
Perché:
- creato/aggiornato da viewer pubblico tramite backend `service_role`
- owner/admin leggono in dashboard

```ts
export const formSessionTable = pgTable(
  "form_session",
  {
    // columns...
  },
  (t) => [
    pgPolicy("form_session_select_owner_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("form_session_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();
```

Nota:
- nessuna policy `insert/update` per `public` o `authenticated`.

## `answer`
Perché:
- contiene STT e metadata audio
- visibile solo owner/admin

```ts
export const answerTable = pgTable(
  "answer",
  {
    // columns...
  },
  (t) => [
    pgPolicy("answer_select_owner_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("answer_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();
```

## `lead`
Perché:
- contiene PII
- visibile solo owner/admin

```ts
export const leadTable = pgTable(
  "lead",
  {
    // columns...
  },
  (t) => [
    pgPolicy("lead_select_owner_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
    pgPolicy("lead_delete_owner_or_admin", {
      for: "delete",
      to: authenticatedRole,
      using: isOwnerOrAdminExpr(t.userId),
    }),
  ],
).enableRLS();
```

## Impatto pratico sui flussi pubblici

Con questo setup:
- `app/form/[formId]/page.tsx` su `publicQuery` continua a funzionare.
- anche utenti autenticati possono leggere form pubblici (policy `to: "public"`).
- nessuna scrittura pubblica diretta su tabelle sensibili.

## Validazioni obbligatorie nei flussi `service_role`

`service_role` bypassa RLS, quindi in `features/forms/public-actions.ts` servono controlli forti:
- `startFormSessionAction`:
  - ignorare `userId` dal client
  - derivare owner dal `formId` a DB
- `submitAnswerAction`:
  - validare coerenza `sessionId` ↔ `formId`
  - validare coerenza `questionId` ↔ `formId`
  - derivare `userId` dal DB (non dal payload)
- `createLeadAction`:
  - validare `sessionId -> formId -> userId`

## Nota di sicurezza applicativa

`SELECT` pubblico su `form/question` espone tutte le colonne consentite dalla tabella via API Supabase.
Se vuoi minimizzare i dati pubblici, usa una view pubblica dedicata o un endpoint server che restituisce solo i campi necessari al viewer.
