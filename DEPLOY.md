# Deploying to Netlify

Everything Netlify needs is already in the repo: [netlify.toml](netlify.toml) sets the build
command, publish directory, the functions folder, the SPA fallback and cache headers, and
[public/_redirects](public/_redirects) repeats the routing rules as a safety net.

## 1. Push the repo

Netlify builds from Git. Push this repository to GitHub (or GitLab/Bitbucket) first.

## 2. Create the site

Netlify → **Add new site** → **Import an existing project** → pick the repo.
The build settings are read from `netlify.toml`, so leave them as detected:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |
| Node version | 20 (set in `netlify.toml`) |

## 3. Environment variables: **before the first deploy**

Site configuration → **Environment variables** → *Add a variable* → *Import from a .env file*
and paste the contents of your local `.env`. The six variables:

| Variable | Value | Read at |
| --- | --- | --- |
| `VITE_TEBEX_TOKEN` | Tebex **public token** (Integrations, Headless API) | build |
| `VITE_TEBEX_STORE_URL` | `https://theheightsla.tebex.io` | build |
| `VITE_DISCORD_URL` | Permanent Discord invite | build |
| `VITE_CONNECT_URL` | `fivem://connect/cfx.re/join/<code>` or an IP | build |
| `FIVEM_SERVER_CODE` | Cfx join code (bare code is fine) | request |
| `DISCORD_INVITE_CODE` | Discord invite code (bare code is fine) | request |

Two things worth knowing:

- **`VITE_*` variables are baked into the bundle at build time.** Changing one needs a new
  deploy to take effect, and a build without `VITE_TEBEX_TOKEN` ships the sample catalog with
  a "Demo mode" notice instead of the real store.
- The other two are read by the stats function on every request, so they can be changed in
  the Netlify UI without rebuilding.

None of the six is secret: the Headless token is public by design (it travels in every API
request, exactly like on a Tebex-hosted store), and both codes appear publicly. The Tebex
**private key** is never used in this project and must not be added.

## 4. Deploy and check

After the first deploy, walk through this:

- [ ] Home loads and the hero sign renders (WebGL); no "Demo mode" pill in the corner.
- [ ] `/store` shows the real packages, and a **hard refresh on a deep link**
      (e.g. `/product/1234567`) returns the page, not a 404 → SPA fallback works.
- [ ] `https://<site>/api/server-stats` returns JSON with `fivem` and `discord` objects.
      With valid codes the hero shows live player and Discord counters.
- [ ] Add to cart → **Sign in with FiveM** redirects to Cfx.re and comes back with the cart
      intact → the Tebex checkout pop-up opens in pink.
- [ ] After a test purchase you land on `/thank-you` and the cart is empty.

## 5. Custom domain

Domain management → **Add a domain**. Netlify issues the HTTPS certificate automatically.
Point the DNS at Netlify (their nameservers, or a `CNAME` to `<site>.netlify.app`).

Once the domain is live, tell Tebex about it: in the Tebex panel the webstore's allowed
return URLs / domain should include it, so the checkout returns to your site. Also update
the `og:image` and `canonical` URLs in `index.html` to the final domain.

## Troubleshooting

**The store shows "Demo mode: Tebex unreachable"**
The build has a token but Tebex refused it (or was down). Run the diagnostic locally:

```bash
npm run check:tebex
```

It prints the token's shape (never its value) and what the API answered. A
`404 "Invalid account identifier provided"` means the value is not a Headless public token
for an existing webstore: copy it again from *Integrations → Headless API* in the Tebex panel.

**The catalog is nearly empty**
The Headless API only serves what the webstore publishes. Open
`https://headless.tebex.io/api/accounts/<token>`, `"disabled": true` means the webstore is
switched off in the Tebex panel.

**Live counters show nothing**
The hero falls back to trust points when `FIVEM_SERVER_CODE` / `DISCORD_INVITE_CODE` are
missing or wrong. Check `/api/server-stats`: each source reports its own `ok` and `error`.

**Deploy previews**
Branch deploys and pull-request previews build with the same settings and the same
environment variables, so they are safe to share with the client.
