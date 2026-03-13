# Performance Form Pubblici

## Obiettivo

I form pubblici sono il punto centrale di conversione dell'applicazione. La priorità è ridurre la latenza percepita in ogni step del funnel (start, avanzamento domanda, submit lead) mantenendo sicurezza e affidabilità.

## KPI da monitorare

- `TTFB` pagina `/form/[assignmentId]` (p50/p95)
- tempo da click su `Avanti` a domanda successiva visibile (p50/p95)
- tempo da submit lead a schermata completata (p50/p95)
- conversion rate per dispositivo/rete
- error rate action pubbliche (`startFormSessionAction`, `submitAnswerAction`, `createLeadAction`)

## Priorità Interventi

## P0 (impatto alto, da fare subito)

### 1) Ridurre verifiche Turnstile per domanda

Oggi la verifica avviene su start sessione, submit risposta e submit lead. La validazione su ogni risposta aggiunge latenza fissa a ogni avanzamento.

Stato: ✅ Implementato parzialmente il 2026-03-13.

Proposta:

- validazione forte su start sessione
- validazione su submit lead
- tra i due step: session token firmato + rate limit lato server

Implementato:

- rimossa la verifica Turnstile nel submit di ogni risposta (`submitAnswerAction`)
- mantenuta la verifica Turnstile su start sessione e submit lead

Ancora aperto:

- session token firmato tra start e lead submit
- rate limit lato server sul flusso pubblico

Impatto atteso: riduzione netta della latenza per domanda e migliore fluidità del flusso.

Riferimenti:

- `features/forms/public-actions.ts`
- `features/forms/components/form-viewer/index.tsx`
- `lib/turnstile/functions.ts`

### 2) Spostare STT fuori dal path sincrono

In `submitAnswerAction`, upload file audio e trascrizione Deepgram bloccano il passaggio alla domanda successiva.

Stato: ✅ Implementato il 2026-03-13 con Trigger.dev.

Proposta:

- salvare subito la risposta audio (o puntatore all'asset)
- ritornare risposta success immediata
- eseguire STT in background (job/queue/worker)

Implementato:

- `submitAnswerAction` inserisce subito la risposta e continua il flow senza attendere STT
- trascrizione delegata al task Trigger.dev `form-answer-stt`
- task background: lettura audio da R2, trascrizione Deepgram, update di `answer.stt`

Impatto atteso: grande riduzione del tempo "click Avanti -> prossima domanda".

Riferimenti:

- `features/forms/public-actions.ts`
- `lib/deepgram/functions.ts`

### 3) Eliminare il payload base64 dal client

La conversione `Blob -> base64` aumenta dimensione payload e costo CPU/memoria client/server.

Proposta:

- upload binario diretto verso storage (presigned URL o endpoint dedicato)
- inviare solo metadati e `fileKey` all'action

Impatto atteso: payload più piccoli, minore GC pressure su mobile, minor tempo serializzazione/deserializzazione.

Riferimenti:

- `features/forms/components/form-viewer/blob-to-base64.ts`
- `features/forms/components/form-viewer/index.tsx`

### 4) Ridurre roundtrip DB nel submit risposta

`submitAnswerAction` esegue più query sequenziali (sessione, domanda, insert answer, count domande, update sessione).

Proposta:

- unificare in RPC transazionale unica
- validazione associazioni + insert + avanzamento indice in un solo passaggio

Impatto atteso: minore latenza server e minore variabilità p95/p99.

Riferimenti:

- `features/forms/public-actions.ts`

## P1 (impatto medio-alto)

### 5) Rendere asincrono il blocco AI finale

`createLeadAction` può eseguire analisi AI + TTS prima della risposta finale.

Proposta:

- salvare lead e rispondere subito (conversione confermata)
- generare analisi/audio in background e salvare risultato in follow-up

Impatto atteso: riduzione tempo completion e minor timeout/abbandono.

Riferimenti:

- `features/forms/public-actions.ts`
- `lib/elevenlabs/functions.ts`

### 6) Saltare auth middleware non necessaria su route pubbliche

La pipeline middleware esegue gestione sessione/auth anche per route pubbliche.

Proposta:

- short-circuit per `/form/*` mantenendo solo header security
- mantenere comportamento attuale su dashboard/admin

Impatto atteso: riduzione TTFB lato edge/server per traffico pubblico.

Riferimenti:

- `proxy.ts`
- `lib/supabase/proxy.ts`

### 7) Aggiungere indici per query hot

Le query più frequenti in runtime pubblico devono avere indici specifici.

Proposta iniziale:

- `question(form_id, order)`
- `question(form_id)`
- `answer(form_session_id)`
- opzionale: `answer(form_id, created_at)` per analytics

Impatto atteso: miglior p95 query e maggiore scalabilità sotto carico.

Riferimenti:

- `lib/db/schema.ts`

## P2 (ottimizzazioni complementari)

### 8) Snellire payload iniziale del viewer

La pagina pubblica carica anche traduzioni non necessarie al viewer.

Proposta:

- inviare al viewer solo namespace i18n necessari
- code-splitting della fase lead (react-hook-form/zod) per alleggerire il primo render

Impatto atteso: bundle iniziale più leggero, miglior rendering su device low-end.

Riferimenti:

- `app/form/[assignmentId]/page.tsx`
- `features/forms/components/form-viewer/lead-form.tsx`
- `messages/*.json`

### 9) Migliorare caching e peso asset media (R2)

Asset audio/immagine impattano molto su reti mobili.

Proposta:

- impostare `Cache-Control` adeguato su upload
- usare naming versionato per invalidazione
- ottimizzare bitrate/durata asset audio

Impatto atteso: minor tempo di caricamento asset e meno ricarichi ripetuti.

Riferimenti:

- `lib/r2/functions.ts`

## Roadmap Esecutiva

### Blocco A (quick wins: 0.5 - 1 giorno)

- monitoring KPI baseline (TTFB, tempo avanzamento domanda, completion latency)
- riduzione verifiche Turnstile per step (parziale: fatto per submit answer)
- bypass middleware auth sulle route pubbliche `/form/*`

### Blocco B (1 - 2 giorni)

- rimozione base64 e passaggio a upload binario
- riduzione roundtrip DB nel submit answer (RPC transazionale)
- indici DB query hot

### Blocco C (2 - 3 giorni)

- STT asincrono (queue/worker) [completato con Trigger.dev]
- AI analysis + TTS asincroni post-lead
- tuning cache e ottimizzazione media

## Piano di rollout

- feature flag per ogni intervento P0/P1
- rollout progressivo (5% -> 25% -> 100%)
- confronto KPI pre/post su p50/p95 e conversion rate
- rollback immediato se peggiora completion rate o error rate

## Note operative

- privilegiare percezione utente: avanzamento domanda immediato anche se elaborazioni continuano in background
- mantenere protezioni anti-abuso con rate limiting e controlli server-side
- evitare regressioni di affidabilità durante picchi di traffico
