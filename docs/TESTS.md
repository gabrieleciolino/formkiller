# Piano Feature Test Virali

Obiettivo: introdurre una nuova macro-funzionalita `Test` separata da `Form`, pensata per quiz virali (Instagram/TikTok style), con generazione AI assistita, revisione admin e pagina pubblica dedicata con risultato a punteggio matematico.

## Scope

- In:
  - Nuova area Admin `Test` (lista, creazione, dettaglio/modifica, eliminazione).
  - Generazione AI bozza test con prompt aggiuntivo opzionale e numero domande.
  - Editor admin per approvazione/modifica di domande, risposte, profili finali e punteggi.
  - Salvataggio definitivo con generazione TTS delle domande.
  - Pagina pubblica `/test/[slug]` con `TestViewer` (senza registrazione vocale, senza lead form, senza analisi GPT runtime).
  - Calcolo risultato finale via somma punteggi e mapping a profilo.
  - Supporto multilingua (`it`, `en`, `es`).
- Out:
  - Raccolta lead nel flusso test.
  - STT/trascrizioni.
  - Analisi AI post-completamento.
  - Modifiche breaking al flusso `Form` esistente.

## Decisioni Confermate

- Salvataggio risultati: **si**, i risultati test vengono persistiti.
- Slug pubblico: **autogenerato** (unico, non editabile in v1).
- Lingue: **multilingua** (`it`, `en`, `es`) end-to-end (admin + pubblico + AI + TTS).

## Azioni

- [ ] Definire nuovo modello dati in `lib/db/schema.ts` con tabelle dedicate:
  - `test` (meta, lingua, slug univoco, stato pubblicazione, intro/outro, owner).
  - `test_question` (ordine, testo domanda, 4 risposte, file TTS).
  - `test_profile` (4 profili finali, titolo/descrizione, ordine).
  - `test_result` (sessione/risultato utente con punteggi aggregati e profilo finale).
- [ ] Aggiungere policy RLS coerenti: lettura pubblica solo dei test pubblicati, gestione admin via `adminQuery`/`adminActionClient`.
- [ ] Creare modulo `features/tests` con file standard:
  - `features/tests/schema.ts`
  - `features/tests/types.ts`
  - `features/tests/queries.ts`
  - `features/tests/actions.ts`
- [ ] Estendere `lib/ai/schema.ts` e `lib/ai/functions.ts` con generazione `viral test`:
  - input: `additionalPrompt?`, `questionsCount`, `language`.
  - output: intro/outro, domande, 4 risposte per domanda, 4 profili finali, matrice punteggi risposta->profilo.
- [ ] Implementare UI Admin in App Router:
  - `app/admin/tests/page.tsx` (lista + CTA crea).
  - `app/admin/tests/create/page.tsx` (prompt aggiuntivo, numero domande, genera bozza).
  - `app/admin/tests/[testId]/page.tsx` (editor completo + salvataggio).
- [ ] Aggiornare navigazione e URL:
  - nuova voce `Test` in sidebar admin.
  - nuove route in `lib/urls.ts`.
- [ ] Riusare il pattern di editing domande esistente e aggiungere componenti nuovi per:
  - gestione profili finali.
  - matrice punteggi per risposta.
  - validazioni strutturali (sempre 4 risposte e 4 profili).
- [ ] Implementare salvataggio definitivo che:
  - persiste configurazione test.
  - genera/rigenera TTS per le domande (solo quando necessario).
  - pubblica il test su `/test/[slug]`.
- [ ] Implementare `TestViewer` pubblico:
  - struttura simile a `FormViewer` ma senza audio input, senza lead form, senza chiamate GPT runtime.
  - avanzamento a risposte predefinite.
  - calcolo risultato locale + persistenza risultato su backend.
  - tie-break deterministico in caso di punteggi pari.
- [ ] Aggiungere i18n con chiavi assolute su `messages/it.json`, `messages/en.json`, `messages/es.json` (`dashboard.tests.*`, `tests.*`, `testViewer.*`).
- [ ] Verificare sicurezza e routing pubblico:
  - includere `/test/*` nelle route pubbliche gestite dal proxy.
  - mantenere header di sicurezza coerenti.
- [ ] Validare la feature end-to-end (admin -> pubblicazione -> compilazione pubblica -> risultato salvato) e garantire `pnpm lint && pnpm build` senza errori.

## Rischi e Mitigazioni

- Coerenza punteggi/profili:
  - mitigazione: validazioni Zod forti e controlli server-side prima del publish.
- Output AI non usabile:
  - mitigazione: step obbligatorio di revisione/approvazione manuale prima del salvataggio.
- Regressioni su `FormViewer`:
  - mitigazione: separare `TestViewer` in namespace `features/tests`.

## Rollout

- Fase 1: schema DB + backend tests.
- Fase 2: admin create/edit + generazione AI.
- Fase 3: pagina pubblica `TestViewer` + persistenza risultati.
- Fase 4: rifiniture i18n, QA finale, release.
