# Creating the VIP tiers in Tebex

How to set up the membership tiers so they render correctly on `/vip`.

Nothing here needs a code change. The page reads the packages straight from the
Headless API and builds both the cards and the comparison table from what you write in
the Tebex panel.

---

## 1. One package per tier

Every tier is **its own Tebex package**. Four tiers means four packages, the page
builds one card and one table column per package, so there is no way to express a
ladder inside a single package.

For each one:

| Setting | Value |
|---|---|
| **Type** | Subscription |
| **Billing period** | Monthly (this is where the `/mo` on the price comes from) |
| **Category** | A category whose name contains **VIP** (also accepted: *membership*, *priority*, *rank*) |
| **Price** | Whatever the tier costs, **the page orders tiers by price, cheapest first** |
| **Description** | A bullet list of the perks, see section 2 |
| **Commands** | Configured per package, exactly like any other product |

A package of type *subscription* is picked up even if it sits outside a VIP-named
category, but keeping them together in one category is cleaner.

> **Minimum two tiers for the comparison table.** With a single tier you get the card
> and nothing else, because there is nothing to compare against.

While the store returns no VIP packages at all, the page shows three placeholder tiers
labelled as a preview. **The first real VIP package removes them automatically**, there
is no setting to flip.

---

## 2. The description format

**Write the description normally, in the Tebex editor. No HTML, no code.**

The same description is shown in two places, the perk list on the VIP cards and table,
*and* the product page: so whatever you type is what buyers read. Paste markup and it
shows up literally, tags and all.

### How to type it

**Write one perk per line.** That is all that is required, press Enter between them and
the page reads each line as a perk.

Using the toolbar's **bullet list** button (`•`) is nicer, because the perks then render
as a proper list on the product page too, but it is optional: plain lines work the same
for the cards and the comparison table.

You can put an intro paragraph above the perks. Full sentences are recognised as prose
and skipped, so they show on the product page without polluting the table. Keep the perks
themselves short: that is what tells them apart.

> The examples below are plain text on purpose: type exactly that, one line each. Do not
> paste HTML into the description box; it is a visual editor and stores markup as literal
> text, which then shows up tag-by-tag on the product page. If you really need to paste
> markup, click the `< >` (code view) button first.

### Copy this, one line per bullet

**DISTRICT SILVER: $25**

```text
Priority queue
2 character slots
3 garage slots
+15% job payout
Exclusive Discord role
```

**DISTRICT GOLD: $50**: write `[Popular]` as a normal line above the list

```text
[Popular]

Everything in District Silver
4 character slots
6 garage slots
+35% job payout
$10,000 cash per month
VIP clothing
```

**DISTRICT DIAMOND: $75**

```text
Everything in District Gold
6 character slots
10 garage slots
+50% job payout
$25,000 cash per month
200x materials per month
Priority support 24/7
```

**DISTRICT AMETHYST: $100**

```text
[Best value]

Everything in District Diamond
10 character slots
Unlimited garage slots
+70% job payout
$40,000 cash per month
600x materials per month
3 limited vehicles per month
Amethyst battlepass access
```

### What that renders

```
BENEFIT                     SILVER      GOLD      DIAMOND    AMETHYST
Limited vehicles per month     ✗          ✗          ✗          3
Amethyst battlepass access     ✗          ✗          ✗          ✓
Materials per month            ✗          ✗        200X       600X
Priority support 24/7          ✗          ✗          ✓          ✓
Cash per month                 ✗      $10,000    $25,000    $40,000
VIP clothing                   ✗          ✓          ✓          ✓
Priority queue                 ✓          ✓          ✓          ✓
Character slots                2          4          6         10
Garage slots                   3          6         10      Unlimited
Job payout                  +15%       +35%       +50%       +70%
Exclusive Discord role         ✓          ✓          ✓          ✓
```

Rows the tiers do not share are sorted to the top, so what actually separates the tiers
is what a buyer reads first.

---

### Any perk you want

There is no fixed list of benefits. Whatever you write becomes a row, the examples above
are just examples. `3 helicopters per month`, `Access to the yacht`,
`2 custom license plates`, `+25% weapon durability`, `Unlimited fuel` all work with no
code change, because the row name and the value are read from the sentence itself:

| You write | Row | Cell |
|---|---|---|
| `3 helicopters per month` | Helicopters per month | `3` |
| `+25% weapon durability` | Weapon durability | `+25%` |
| `2 custom license plates` | Custom license plates | `2` |
| `Unlimited fuel` | Fuel | `UNLIMITED` |
| `Access to the yacht` | Access to the yacht | ✓ |

The only things that must follow a shape are in the next section.

## 3. The four rules

### Put the amount first

```
✅  4 character slots          →  row "Character slots", pill "4"
✅  +35% job payout            →  row "Job payout", pill "+35%"
✅  $10,000 cash per month     →  row "Cash per month", pill "$10,000"
✅  200x materials per month   →  row "Materials per month", pill "200X"
✅  Unlimited garage slots     →  row "Garage slots", pill "UNLIMITED"
❌  Character slots: 4         →  the amount is not read as a quantity
```

A perk with no amount renders as a plain ✓, which is exactly right for things like
"Priority queue" or "VIP clothing".

Ratios and version numbers are treated as wording, not amounts, so `24/7`, `1v1` and
`Season 2.0` stay in the row name instead of turning into a pill.

### Keep the wording identical across tiers

Rows are grouped by word similarity. Same perk, same words:

```
✅  Silver: 3 garage slots     Gold: 6 garage slots     →  one row
❌  Silver: 3 garage slots     Gold: 6 car slots        →  two separate rows
```

If a perk shows up as two rows on the page, this is why, check the wording.

### Use "Everything in <lower tier>"

```html
<li>Everything in District Gold</li>
```

Read as inheritance, never shown as its own row. The tier picks up every perk below it,
and it chains all the way down (Amethyst → Diamond → Gold → Silver), so each tier only
needs to list what it *adds*.

If a tier restates a perk with a bigger number, that number wins over the inherited one.
That is how `3 / 6 / 10 / Unlimited garage slots` ends up correct on every column.

The lower tier is matched by name, so write it the way the package is named. If the name
does not match anything, it falls back to the tier directly below by price.

### Tags

Written at the very start of the description, before the list:

| Tag | Effect |
|---|---|
| `[Popular]` | Highlights the tier: accent border, badge, filled button, highlighted table column |
| `[Recommended]` | Same as `[Popular]` |
| `[Most picked]` | Same as `[Popular]` |
| `[Best value]` | Shows as a badge but does **not** highlight, it usually belongs on the top tier |

With no tag anywhere, the second cheapest tier is highlighted. If several tiers carry a
highlight tag, the most expensive one wins.

---

## 4. Tier colours

Taken from the package name automatically:

| Name contains | Colour |
|---|---|
| bronze, copper | bronze |
| silver, steel | silver |
| gold, golden | gold |
| platinum | ice blue |
| diamond, crystal | blue |
| amethyst, purple | purple |
| emerald, jade | green |
| ruby, crimson | red |
| obsidian, onyx, black | grey |

Anything else falls back to the store's magenta/violet ramp. So `DISTRICT AMETHYST`
renders purple with no configuration.

---

## 5. What shows where

- **Cards**: up to four tiers across, each showing the first six perks. From the fifth
  tier onwards a link to the full store appears below them.
- **Comparison table**: every tier and every perk, no limit. Needs at least two tiers
  and at least one bullet list.
- **Prices**: the discounted price with the original struck through, whenever the
  package is on sale in Tebex.

---

## 6. Worth checking: tiered categories

Your categories come back from the API with a `tiered` field, currently `false`. That is
the Tebex panel option for subscription ladders, it lets a player move between tiers
without cancelling and re-subscribing. It still needs one package per tier, and the page
does not depend on it, but it is a noticeably better upgrade path for the player. Worth
a look when you load the real tiers.

---

## 7. Troubleshooting

**The description shows `&lt;li&gt;` / `<ul>` / ``` ```html ``` literally on the product page.**
Raw HTML was pasted into the visual editor, so it was stored as text. Clear the
description and retype it with the bullet-list button, see section 2. The comparison
table now unescapes this case as a safety net, so the perks still appear there, but the
product page shows exactly what is stored, so it has to be fixed at the source.

**The comparison table does not appear at all.**
It needs at least **two** tiers. With a single tier there is nothing to compare, so only
the card renders: that is expected, not a bug.

**A perk is missing from the card or the table.**
The line is probably being read as prose. Lines over 80 characters, and lines over 45
that end in a full stop, are skipped so intro paragraphs do not become rows. Shorten it.

**A perk shows up as two separate rows.**
The wording differs between tiers. Rows are grouped by word similarity, so
`3 garage slots` and `3 car slots` are treated as different perks. Use the same words.

**A number is not showing as a pill.**
It must be at the start of the bullet: `4 character slots`, not `Character slots: 4`.

**The placeholder tiers are still showing.**
The store is returning no VIP packages yet. Check
`https://headless.tebex.io/api/accounts/<token>/categories?includePackages=1`, the tier
has to be there, of type `subscription`, for the page to pick it up.

## 8. Checklist

- [ ] One subscription package per tier, monthly billing
- [ ] All of them in a category whose name contains "VIP"
- [ ] Prices set: they define the display order
- [ ] Each description carries a bullet list
- [ ] Amounts written at the start of each bullet
- [ ] The same perk worded identically across tiers
- [ ] Higher tiers use `Everything in <lower tier>`
- [ ] One tier tagged `[Popular]`
- [ ] Delivery commands configured per package

Once they are live, open `/vip`: the preview notice disappears on its own and the real
tiers take over.
