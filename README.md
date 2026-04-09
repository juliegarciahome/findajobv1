## Findmejob.ai (local dev)

Jobs pipeline portal: ingest job URLs, evaluate fit with AI, generate a PDF report, and track application progress per tenant (email).

### Run

```bash
npm run dev:all
```

- Web: `http://localhost:3005`
- Worker: runs alongside web
- DB: started automatically by the `predev:all` hook

### Multi-tenant

Set your tenant email in **Settings** or via the tenant switcher; all API requests include `x-user-email`.