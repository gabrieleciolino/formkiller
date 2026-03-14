# Piano Feature Carousel Instagram (Test)

Obiettivo: introdurre un flusso in 2 fasi per creare caroselli Instagram da un test pubblicato.

- Fase 1: generazione e revisione di copy + prompt per 4 slide.
- Fase 2: generazione immagini in background dal dettaglio test.

## Scope

- In:
  - Generazione bozza di 4 slide carousel legate a un test.
  - Revisione manuale admin di copy e prompt prima del rendering immagini.
  - Nuova voce menu admin `Slides`.
  - Pagina `Slides` con lista test in formato card.
  - Pagina dettaglio `Slides` per singolo test con elenco slide relative.
  - Trigger generazione immagini da pagina dettaglio `Slides` del test.
  - Esecuzione asincrona via Trigger.dev.
  - Generazione immagini con pacchetto `ai` + provider `@ai-sdk/google`.
  - Persistenza stato slide e output immagini.
- Out:
  - Visualizzazione o gestione slide dentro `Library`.
  - Publishing automatico su Instagram.
  - Scheduling editoriale/social calendar.
  - Editing grafico avanzato post-generazione.

## Decisioni confermate

- Formato immagini carousel: `4:5` (1080x1350).
- Rigenerazione slide: sovrascrive l'immagine esistente.
- Prompt immagini: nella stessa lingua del test (`it`, `en`, `es`).

## Specifica contenuti slide

- Slide 1 (intro):
  - hook
  - descrizione breve
  - titolo test
  - call to action
- Slide 2:
  - prima domanda del test
  - 4 risposte relative
- Slide 3:
  - seconda domanda del test
  - 4 risposte relative
- Slide 4 (finale):
  - call to action per compilare il test e scoprire il risultato

Per ogni slide devono essere salvati:
- copy finale
- prompt Gemini finale per la generazione immagine
- stato generazione
- riferimento file immagine generata

## Action items

- [ ] Estendere modello dati con tabella `test_slide` (o equivalente) per memorizzare 4 slide per test con:
  - `test_id`, `order`, `copy`, `image_prompt`, `image_file_key`, `generation_status`, `generation_error`, timestamp.
- [ ] Estendere `lib/db/schema.ts` con enum di stato generazione (es. `idle | processing | completed | failed`) e policy RLS admin-only per CRUD slide.
- [ ] Aggiungere schema/tipi in `features/tests/schema.ts` e `features/tests/types.ts` per:
  - generazione bozza slide
  - salvataggio revisione copy/prompt
  - trigger generazione immagini
  - lettura stato slide.
- [ ] Estendere `lib/ai/schema.ts` e `lib/ai/types.ts` con output strutturato per le 4 slide.
- [ ] Implementare funzione AI server-side per bozza slide (copy + prompt) usando dati test gia esistenti:
  - intro (`name`, `introTitle`, `introMessage`)
  - domande ordinate (`order`) e relative risposte
  - CTA finale su `endTitle`/`endMessage`.
- [ ] Implementare azioni/query in `features/tests/actions.ts` e `features/tests/queries.ts`:
  - `generateTestCarouselDraftAction`
  - `saveTestCarouselDraftAction`
  - `triggerTestCarouselGenerationAction`
  - `getTestCarouselByTestIdQuery`.
- [ ] Aggiungere routing e navigazione area Slides:
  - `urls.admin.slides.index` e `urls.admin.slides.detail(testId)`
  - voce `Slides` in `app/admin/__components/admin-sidebar.tsx`.
- [ ] Creare pagina `app/admin/slides/page.tsx`:
  - carica test admin
  - mostra i test come card
  - click card -> dettaglio slide del test.
- [ ] Creare pagina `app/admin/slides/[testId]/page.tsx` con nuovo componente sheet:
  - bottone "Genera slide"
  - editor copy + prompt per ciascuna slide
  - stato per-slide (`idle/processing/completed/failed`)
  - preview immagine generata quando disponibile.
- [ ] Implementare task Trigger.dev (es. `trigger/test-carousel-generation.ts`) che:
  - riceve `testId`
  - legge le 4 slide salvate
  - genera immagini con `ai` + `@ai-sdk/google` in formato 4:5
  - sovrascrive `image_file_key` della slide
  - aggiorna stati/errori in modo idempotente.
- [ ] Salvare output immagine su R2 e mantenerne il riferimento solo nel dominio slide/test (senza integrazione con `Library`).
- [ ] Aggiungere chiavi i18n assolute in `messages/it.json`, `messages/en.json`, `messages/es.json` sotto `tests.carousel.*`.
- [ ] Revalidare route admin test al termine delle azioni (`revalidatePath`) per riflettere stato aggiornato.
- [ ] Verificare flusso end-to-end:
  - genera bozza -> revisione -> salva -> trigger background -> immagini disponibili.
- [ ] Eseguire controlli finali obbligatori:
  - `pnpm lint`
  - `pnpm build`

## Rischi e mitigazioni

- Prompt troppo deboli o incoerenti con il brand:
  - mitigazione: revisione manuale obbligatoria prima del trigger.
- Job duplicati o race condition su trigger multipli:
  - mitigazione: lock logico per test e idempotenza update stato.
- Errori parziali (una slide fallisce, altre no):
  - mitigazione: stato per singola slide e retry mirato.

## Rollout

- Fase 1: schema dati + azioni/query backend per draft/revisione.
- Fase 2: area admin `Slides` (menu + card test + dettaglio test).
- Fase 3: task Trigger.dev + generazione immagini Google.
- Fase 4: QA finale, stabilizzazione e release.
