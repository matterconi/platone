# TODO

## Feature da implementare

### Rimborso self-service
- Aggiungere un endpoint accessibile dall'utente (es. `GET /api/subscription/refund-eligible`) che controlli l'eleggibilità del proprio account
- Usarlo nella UI di cancellazione: mostrare "Richiedi rimborso" vs "Non eleggibile" prima che l'utente annulli
- L'admin endpoint esistente (`/api/admin/refund-eligible`) rimane per uso interno

## Test da completare (dopo aver costruito il frontend)

### `src/app/api/interviews/` — storico interviste utente
- Implementare la pagina/sezione "My Interviews" nella dashboard
- Collegare il componente `Interviews.tsx` (già scritto ma non importato da nessuna parte)
- Completare i test: `src/app/api/interviews/__tests__/interviews.test.ts`
- Completare i test: `src/app/api/interviews/filters/__tests__/filters.test.ts`

### `src/app/api/attempts/` — retry su un'intervista
- Implementare il frontend per il "try again" su un'intervista esistente
- Completare i test: `src/app/api/attempts/__tests__/attempts.test.ts`
