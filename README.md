# RadioChron website

Source for [radiochron.com](https://radiochron.com), a static website deployed with Cloudflare Workers Static Assets.

The deployable files live in `public/`. The site uses no client-side JavaScript, analytics, cookies, or telemetry.

## Repository family

- [`radiochron`](https://github.com/sergii-ziborov/radiochron) — IoT-focused Rust library
- [`radiochron-mcp`](https://github.com/sergii-ziborov/radiochron-mcp) — MCP server
- [`radiochron-js`](https://github.com/sergii-ziborov/radiochron-js) — standalone Node/npm library over the Rust core
- [`radiochron-electron`](https://github.com/sergii-ziborov/radiochron-electron) — separate Windows/macOS desktop application using `radiochron-js`

## Verify and run

```console
node scripts/check-site.mjs
npx wrangler dev
```

Deployment is intentionally explicit:

```console
npx wrangler deploy
```

The custom-domain routes are defined in `wrangler.jsonc`.
