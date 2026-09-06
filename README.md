# RadioChron website

Source for [radiochron.com](https://radiochron.com), a static website deployed with Cloudflare Workers Static Assets.

The deployable files live in `public/`. The site uses no client-side JavaScript, analytics, cookies, or telemetry.

The `/blog/` section hosts long-form research notes. The first post explains the
recovered-link paradox, the shared incident classifier, and how Desktop / MCP /
Agent / Node keep one verdict.

The Desktop page includes Electron-captured synthetic screenshots for the
shared Wi-Fi/Bluetooth map, OS-confirmed connected/paired Bluetooth links,
unlinked radio observations, and filterable 1/7/30-day presence analytics.
No real SSID, address, or device identity is used in those images.

`public/data/bluetooth-assigned-numbers.json` is the downloadable, versioned
company/service/appearance snapshot bundled with RadioChron Desktop. Its source
revision and BSD-3-Clause attribution are embedded in the file and repeated in
`public/data/NOTICE.txt`.

## Repository family

- [`radiochron`](https://github.com/sergii-ziborov/radiochron) — IoT-focused Rust Wi-Fi/BLE library
- [`radiochron-mcp`](https://github.com/sergii-ziborov/radiochron-mcp) — MCP server
- [`radiochron-js`](https://github.com/sergii-ziborov/radiochron-js) — standalone Node/npm library over the Rust core
- [`radiochron-agent`](https://github.com/sergii-ziborov/radiochron-agent) — unattended Wi-Fi/BLE collector with durable spool and MQTT/OTLP/Prometheus export
- [`radiochron-electron`](https://github.com/sergii-ziborov/radiochron-electron) — separate Windows/macOS Wi-Fi/BLE desktop application using `radiochron-js`

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
