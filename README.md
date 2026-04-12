## Findmejob.ai (local dev)

Jobs pipeline portal: ingest job URLs, evaluate fit with AI, generate a PDF report, and track application progress per tenant (email).

### Run

```bash
npm run dev:all
```

- Web: `http://localhost:3005` (use **http**, not https, unless you configure HTTPS yourself)
- Worker: runs alongside web
- DB: started automatically by the `predev:all` hook

### Multi-tenant

Set your tenant email in **Settings** or via the tenant switcher; all API requests include `x-user-email`.

### Production (Docker + optional Cloudflare Tunnel)

Use this when **findmejob.ai** should be served through Cloudflare Tunnel (fixes HTTP 530 / error 1033 when the tunnel process was offline).

1. Copy `.env.example` to `.env` and set at least `CLOUDFLARE_TUNNEL_TOKEN` (from **Cloudflare Zero Trust → Networks → Tunnels → your tunnel → Configure**). Set `NEXT_PUBLIC_APP_URL=https://findmejob.ai` before building so the client bundle uses the public URL. Add AI keys if needed.
2. In the tunnel’s **Public Hostname** for this site, point the service to **`http://web:3005`** (the Compose service name and internal port). `localhost` will not work from inside the tunnel container.
3. Start the stack:

```bash
npm run docker:up:tunnel
```

This builds and runs Postgres, Redis, the Next.js app on port **3005**, and `cloudflared`. For local Docker **without** the tunnel, use `npm run docker:up`.