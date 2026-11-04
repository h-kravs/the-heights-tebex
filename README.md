# The Heights LA | Official Store

The official webstore for the US-based FiveM server **The Heights LA**, built on top of the
[Tebex Headless API](https://docs.tebex.io/developers/headless-api/endpoints). Packages,
prices, images and categories all come straight from the Tebex panel, so the day to day work
happens there and not in this code.

---

## 1. What you need to know first

**Nothing here needs code changes to sell something new.** Once the token is set, the store
is connected to the live Tebex webstore: real packages, real prices, real checkout.

| I want to | Where I do it |
| --- | --- |
| Add, remove or reprice a package | Tebex panel |
| Change a package image or description | Tebex panel |
| Put something on sale | Tebex panel |
| Set up the VIP tiers | Tebex panel, see [docs/VIP-SETUP.md](docs/VIP-SETUP.md) |
| Change the Discord link, server address, FAQ, page texts | `src/data/site.js` in this repo |
| Replace the logo | `inspo/logo.png`, then `npm run brand` |
| Put the site online | Netlify, see [DEPLOY.md](DEPLOY.md) |

## 2. Running it on your own machine

You need [Node.js 20 or newer](https://nodejs.org). Then, in a terminal inside this folder:

```bash
npm install          # once, downloads the dependencies
npm run dev          # starts the site on http://localhost:5200
```

Other commands:

```bash
npm run build        # builds the production version into dist/
npm test             # runs the automated checks
npm run check:tebex  # tells you whether your Tebex token works
npm run brand        # regenerates logo, favicons and the social image from inspo/logo.png
```

## 3. Configuration: the `.env` file

Secrets and links live in a file called `.env`, which is deliberately **not** in the
repository. Copy the template and fill it in:

```bash
cp .env.example .env
```

| Variable | What it is | Where to find it |
| --- | --- | --- |
| `VITE_TEBEX_TOKEN` | Your webstore's public token | Tebex panel, **Integrations → Headless API**, the **public token** |
| `VITE_TEBEX_STORE_URL` | `https://theheightsla.tebex.io` | Your Tebex store address |
| `VITE_DISCORD_URL` | Your permanent Discord invite | Discord |
| `VITE_CONNECT_URL` | `fivem://connect/cfx.re/join/<code>` | Your server's Cfx join code |
| `FIVEM_SERVER_CODE` | Your Cfx join code | Used for the live player counter |
| `DISCORD_INVITE_CODE` | Your Discord invite code | Used for the live Discord counter |

After changing `.env`, restart `npm run dev`.

**About the token.** The public token is public by design: it travels in every request the
website makes, exactly like on a Tebex hosted store, and it only allows reading your catalog
and creating baskets. The **private key** from that same Tebex page is a different thing, it
is never used by this website, and it must never be put in `.env` or anywhere in this repo.

If the token is missing or wrong, the site does not break. It falls back to a sample catalog
and shows a "Demo mode" notice in the corner so nobody mistakes it for the real store.

## 4. Running the store from Tebex

### Categories

Every top-level category in Tebex gets a tile on the home page, a pill in the store filter
bar and a link in the footer. Sub-categories work too: a parent page shows everything from
its children and adds chips to filter between them.

The **VIP** page and the VIP block on the home page use the category whose name contains
VIP, membership, subscription, rank or tier. Until one exists the VIP page shows three
placeholder tiers, clearly labelled as a preview, with the buy button disabled.

### Packages

Whatever you configure in Tebex is what visitors see:

- **Images**: the package image, the extra media, and any image inside the description all
  end up in the product gallery. A package without an image gets branded artwork with the
  THL mark, so the shop never looks half finished.
- **Prices and sales**: set a discount in Tebex and the site shows the percentage badge and
  the old price struck through. The deepest discount in the catalog is also pinned as the
  "drop" ticket on the hero.
- **Subscriptions**: shown with `/mo`, and they feed the VIP page.
- **Perks**: write the contents of a package as a bullet list in the description. Those
  bullets become the checkmark lists on the cards, the product page and the VIP tier
  switcher. A bullet reading `Everything in <lower tier>` is shown as inheritance.

### Highlighting a package

Start a package description with a tag between square brackets to control how it stands out:

```
[Featured, New] A fully tuned Audi RS6…
```

| Tag | What it does |
| --- | --- |
| `Featured` / `Hot` | Leads the "Hot in the city" section on the home page |
| `New` | Badge on the card |
| `Popular` / `Most picked` / `Recommended` | Badge, and marks the highlighted VIP tier |
| `Bundle` / `Pack` | Badge |
| `Limited` | Badge |
| `Best value` | Badge |
| `Premium` / `Exclusive` | Badge |

The tag itself is stripped from the text, so visitors never see the brackets.

## 5. Changing texts and links

Almost everything you might want to reword lives in one file, **`src/data/site.js`**:

- the menu items,
- the Discord invite and the server connect link,
- the four trust points under the hero,
- the four "How it works" steps,
- the FAQ questions and answers,
- the scrolling banner words.

Other texts sit in their own page: `src/pages/Legal.jsx` for the terms,
`src/pages/Support.jsx` for the support page, `src/pages/Home.jsx` for the hero.

## 6. Putting it online

Full instructions with a checklist are in **[DEPLOY.md](DEPLOY.md)**. The short version:
connect this repository to Netlify, add the six variables from your `.env` under Site
configuration, and deploy. The build settings are already in `netlify.toml`.

One thing to remember: the `VITE_` variables are baked in when the site is built, so after
changing one in Netlify you have to trigger a new deploy for it to take effect.

## 7. How a purchase works

1. Visitors browse and fill their cart freely. The cart is saved in their browser, so there
   is no login wall in front of the shop.
2. At checkout they sign in with their **FiveM (Cfx.re) account**. Tebex requires this,
   because that is how it knows which player to deliver to. The cart survives the redirect.
3. The site syncs the cart into the Tebex basket, checks that the basket is really filled,
   and only then opens the Tebex payment pop-up (in the brand colors, no redirect). If
   something fails it says so instead of opening an empty checkout.
4. After payment the buyer lands on the thank you page and the cart is emptied.

Payments, invoices and refunds are all handled by Tebex. This website never sees card details.

## 8. The live counters

The player count and Discord numbers on the home page are real. A small serverless function
reads the Cfx server list and the Discord invite, because browsers are not allowed to call
those directly. No bot and no Discord token are needed.

If a source is unavailable, the page quietly shows trust points instead. No number is ever
made up.

## 9. Troubleshooting

**The site shows a "Demo mode" notice**
The token is missing or Tebex refused it. Run `npm run check:tebex`. It prints what the API
answered and never prints your token. A `404 Invalid account identifier` means the value is
not the public token of an existing webstore: copy it again from **Integrations → Headless API**.

**The shop looks almost empty**
The Headless API only serves what your webstore actually publishes. Open
`https://headless.tebex.io/api/accounts/<your token>` in a browser. If it says
`"disabled": true`, the webstore is switched off in the Tebex panel.

**The counters are missing**
Check `https://<your site>/api/server-stats`. Each source reports its own status there.

## 10. For developers

React 19, Vite 8, Tailwind 4, Three.js through React Three Fiber, Framer Motion, Lenis.

```
src/
  components/   Navbar, CartDrawer, ProductCard, HeightsScene (the 3D hero), VipSwitcher, Intro (first-visit curtain), Drip, Footer, ...
  pages/        Home, Store (/store and /store/:category), Product (/product/:id-slug),
                Vip, Support, ThankYou (/thank-you), Legal (/terms), NotFound
  stores/       catalogStore (catalog, fetched once), cartStore (Tebex basket), toastStore
  lib/          tebex.js (API client and helpers), catalog.js and vipTable.js (pure, unit
                tested), sanitizeHtml.js, demoData.js, demoVips.js, categoryMeta.js
  data/site.js  Menu, FAQ, steps, trust points and links
netlify/        The live stats function
scripts/        brand.mjs (logo, favicons, social image), check-tebex.mjs (connection check)
tests/          Plain node:assert tests, no framework
```

Worth knowing before changing things:

- **Package descriptions are untrusted HTML** and go through an allow list sanitiser in
  `src/lib/sanitizeHtml.js` before being rendered.
- **The cart is deliberately two phase** (local while browsing, synced at checkout) because
  Tebex rejects packages on a FiveM store until the buyer has authenticated.
- **The 3D hero is lazy loaded**, pauses when it scrolls out of view, drops detail on phones
  and slow devices, respects reduced motion, and falls back to a CSS version without WebGL.
  No other page downloads Three.js.
- **Brand assets** are generated from `inspo/logo.png` with `npm run brand`.
- **Colors and fonts** are defined once as tokens at the top of `src/index.css`. The
  display face is Archivo on its condensed width axis: `.font-display` for headings,
  `.font-label` for small labels (never thin, never mono), `.font-poster` for the hero.
  Buttons and eyebrows are skewed slabs drawn with a pseudo-element so the text stays upright.
- The em dash character is not used anywhere in this project. `node scripts/strip-em-dashes.mjs`
  reports any that slip in, and with `--write` it fixes them.

---

Built by [The Orb](https://theorb.tech).
- `public/demo/`: artwork for the sample catalog, generated with `node scripts/demo-images.mjs` (kie.ai) and shrunk with `node scripts/demo-images-optimize.mjs`. Demo only: real packages take their images from Tebex.
