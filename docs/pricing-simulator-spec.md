---
id: pricing-simulator-spec
title: "Pricing Simulator — Logic Spec for Attila"
type: spec
status: active
owner: ivan
created: 2026-02-20
updated: 2026-02-20
tags: [hackathon, pricing, simulator, puzzle, spec]
---

# Pricing Simulator — Full Logic Spec

Attila: this is how the pricing simulator works. The math, the inputs, the outputs, what the slider does, and when the recommendation flips. You build the UI + integration, this defines the business logic.

All numbers are calibrated for a **B2B growth agency** — monthly retainers, recurring revenue, client lifetime value. This isn't SaaS math. It's service business math where every discount compounds across the entire client relationship.

---

## Puzzle Integration

The financial baseline uses **exact Puzzle terminology**. In the demo we say: "Financial modeling powered by Puzzle metrics." The baseline comes from `data/financials.json` — "your company's Puzzle dashboard synced into the app."

When Puzzle API becomes available (post-hackathon or on Saturday if sponsors give access), this swaps from configured baseline to live sync. The math stays identical.

---

## Financial Baseline (from Puzzle)

Calibrated for a B2B growth/marketing agency — 12 retainer clients, AI-native (higher margins than traditional agencies because less human labor).

```json
{
  "available_cash_balance": 340000,
  "monthly_burn": 24000,
  "burn_rate_3mo_avg": 23500,
  "burn_multiple": 1.8,
  "runway_months": 14.2,
  "cash_out_date": "2027-05-15",
  "mrr": 47000,
  "arr": 564000,
  "gross_margin_pct": 72,
  "cogs_per_dollar": 0.28,
  "customers": 12,
  "avg_deal_size": 48000,
  "avg_monthly_retainer": 4000,
  "avg_client_lifetime_months": 14,
  "commission_rate_pct": 10,
  "spotlight_anomalies": []
}
```

**Why 72% margin:** Traditional agencies run 40-55% margins. AI-native agencies replace junior headcount with AI, pushing margins to 65-75%. This is our actual operating model.

**Why 14-month average lifetime:** Industry benchmark for B2B agencies is 12-18 months. 14 is conservative middle. Source: HubSpot Agency Partner benchmarks.

---

## Two Tools, One Flow

### Tool 1: `deal_impact`

Called when user says "What does a $4K/mo retainer mean for my business?" or "What does a $50K annual deal mean?"

**Inputs:**

- `deal_size` (annual) — e.g. 48000 ($4K/mo retainer × 12)
- Can also accept `monthly_retainer` — e.g. 4000, converted to annual
- Baseline from financials.json (always loaded)

**Calculations:**

```
monthly_retainer = deal_size / 12
cogs_monthly     = monthly_retainer * cogs_per_dollar    // $1,120 on $4K retainer
gross_profit_mo  = monthly_retainer - cogs_monthly        // $2,880/mo

new_mrr          = mrr + monthly_retainer
mrr_change_pct   = (monthly_retainer / mrr) * 100
new_arr          = arr + deal_size

// Runway: new cash inflow reduces effective burn
net_new_cash_mo  = gross_profit_mo                        // only profit extends runway
new_eff_burn     = monthly_burn - net_new_cash_mo
new_runway       = available_cash_balance / new_eff_burn
runway_change    = new_runway - runway_months

commission       = deal_size * (commission_rate_pct / 100)

// Lifetime value of this client
ltv              = monthly_retainer * avg_client_lifetime_months    // $56,000
ltv_profit       = gross_profit_mo * avg_client_lifetime_months     // $40,320

// Context
client_rank      = rank deal_size against avg_deal_size
```

**Output (displayed as dashboard cards + charts):**

| Metric       | Before      | After           | Change             |
| ------------ | ----------- | --------------- | ------------------ |
| MRR          | $47,000     | $51,000         | +$4,000 (+8.5%)    |
| ARR          | $564,000    | $612,000        | +$48,000           |
| Runway       | 14.2 months | 16.1 months     | +1.9 months        |
| Gross Margin | 72%         | 72% (unchanged) | —                  |
| Commission   | —           | $4,800          | 10% of annual      |
| Client LTV   | —           | $56,000         | 14 months × $4K    |
| LTV Profit   | —           | $40,320         | 14 months × $2,880 |

**Charts:**

1. MRR line chart: 12-month projection (current trajectory vs with-deal)
2. Runway gauge: before → after
3. LTV bar: revenue vs profit over client lifetime

---

### Tool 2: `simulate_pricing` (THE WOW MOMENT)

This is the interactive slider. Called when user says "What if I offer them 20% discount?" — OR the judge drags the slider directly.

**Inputs:**

- `deal_size` (annual, carried from deal_impact) — e.g. 48000
- `discount_pct` (from slider, 0-40%, step 1) — e.g. 20
- `deal_stage` (dropdown or LLM-set, determines base close probability)
- Baseline from financials.json

---

## The Probability Model

**Deal stage determines base close probability.** This is standard B2B pipeline math, not made up:

| Stage         | Base Close Rate | Source                                     |
| ------------- | --------------- | ------------------------------------------ |
| Discovery     | 15%             | Industry avg: 10-20% at qualification      |
| Proposal Sent | 35%             | Industry avg: 30-40% post-proposal         |
| Negotiation   | 55%             | Industry avg: 50-60% in active negotiation |
| Verbal Commit | 80%             | Industry avg: 75-85% verbal but unsigned   |

**Default for demo: Negotiation (55%).** This is the most interesting stage because it creates a meaningful flip point.

**Discount effect on close probability:**

Discounts don't linearly increase close probability. Three real dynamics at play:

1. **Diminishing returns** — the first 10% matters more than the next 10%
2. **Quality signal** — above ~25% discount, buyers start wondering "what's wrong with this?" or "will they actually deliver at this price?"
3. **Cap** — no discount gets you to 100%. Deals fail for non-price reasons (timing, champion leaves, reorg, budget freeze)

```
// How much room to improve close probability
gap = 100 - base_close_rate

// Discount lifts probability along a curve that peaks then flattens
// Maximum possible lift = 50% of the remaining gap
max_lift = gap * 0.50

// Logarithmic lift — big impact early, diminishing returns
// At 10% discount: ~65% of max lift achieved
// At 20% discount: ~85% of max lift achieved
// At 30% discount: ~95% of max lift achieved (barely moving)
raw_lift = max_lift * (1 - Math.exp(-0.10 * discount_pct))

// Quality concern penalty kicks in above 20%
// Buyers discount your capabilities when you discount your price
// "If they're willing to cut 30%, were they overcharging me?"
quality_penalty = discount_pct > 20 ? (discount_pct - 20) * 0.6 : 0

// Final close probability
close_prob_with = Math.min(base_close_rate + raw_lift - quality_penalty, 95)
close_prob_with = Math.max(close_prob_with, base_close_rate)  // can't go below base
```

**Example: Negotiation stage (55% base), gap = 45, max_lift = 22.5:**

| Discount | Raw Lift | Quality Penalty | Net Lift | Close Prob |
| -------- | -------- | --------------- | -------- | ---------- |
| 0%       | 0        | 0               | 0        | 55.0%      |
| 5%       | 8.9      | 0               | +8.9     | 63.9%      |
| 10%      | 14.8     | 0               | +14.8    | 69.8%      |
| 15%      | 18.5     | 0               | +18.5    | 73.5%      |
| 20%      | 20.5     | 0               | +20.5    | 75.5%      |
| 25%      | 21.6     | 3.0             | +18.6    | 73.6%      |
| 30%      | 22.1     | 6.0             | +16.1    | 71.1%      |
| 35%      | 22.3     | 9.0             | +13.3    | 68.3%      |
| 40%      | 22.4     | 12.0            | +10.4    | 65.4%      |

**Notice: probability PEAKS around 20% then DECLINES.** This is realistic and creates fascinating demo behavior. The sweet spot is real — every experienced salesperson knows "there's a discount amount that helps, and beyond it you look desperate."

---

## Margin Math (Correct Formula)

Discounts reduce revenue but COGS stays the same. Your team still does the same work. This means margin erodes FASTER than revenue:

```
monthly_retainer_discounted = monthly_retainer * (1 - discount_pct / 100)
cogs_monthly = monthly_retainer * cogs_per_dollar  // UNCHANGED — same work
gross_profit_discounted = monthly_retainer_discounted - cogs_monthly
margin_at_discount = gross_profit_discounted / monthly_retainer_discounted * 100

// Equivalent formula:
margin_at_discount = (1 - cogs_per_dollar / (1 - discount_pct / 100)) * 100
```

**Example with $4,000/mo retainer, 28% COGS ($1,120/mo):**

| Discount | Retainer | COGS (fixed) | Gross Profit | Margin |
| -------- | -------- | ------------ | ------------ | ------ |
| 0%       | $4,000   | $1,120       | $2,880       | 72.0%  |
| 5%       | $3,800   | $1,120       | $2,680       | 70.5%  |
| 10%      | $3,600   | $1,120       | $2,480       | 68.9%  |
| 15%      | $3,400   | $1,120       | $2,280       | 67.1%  |
| 20%      | $3,200   | $1,120       | $2,080       | 65.0%  |
| 25%      | $3,000   | $1,120       | $1,880       | 62.7%  |
| 30%      | $2,800   | $1,120       | $1,680       | 60.0%  |
| 35%      | $2,600   | $1,120       | $1,480       | 56.9%  |
| 40%      | $2,400   | $1,120       | $1,280       | 53.3%  |

---

## The Killer Insight: Lifetime Value Erosion

This is what makes the simulator uniquely valuable for agencies. **You're not discounting one payment — you're discounting every month for 14 months.**

```
// LTV at full price
ltv_full = monthly_retainer * avg_client_lifetime_months
ltv_profit_full = gross_profit_monthly * avg_client_lifetime_months

// LTV at discount
ltv_discounted = monthly_retainer_discounted * avg_client_lifetime_months
ltv_profit_discounted = gross_profit_discounted * avg_client_lifetime_months

// Discounted clients also tend to churn faster (feel undervalued, or agency resents the work)
// Industry data: clients acquired at >15% discount have ~20% shorter retention
retention_factor = discount_pct > 15 ? 1 - ((discount_pct - 15) * 0.008) : 1.0
// At 20%: 0.96x retention (13.4 months instead of 14)
// At 30%: 0.88x retention (12.3 months)
// At 40%: 0.80x retention (11.2 months)

adjusted_lifetime = avg_client_lifetime_months * retention_factor
ltv_adjusted = monthly_retainer_discounted * adjusted_lifetime
ltv_profit_adjusted = gross_profit_discounted * adjusted_lifetime

// THIS is the number that makes founders go "oh shit"
ltv_lost = ltv_profit_full - ltv_profit_adjusted
```

**Example: $4,000/mo retainer, 14-month lifetime:**

| Discount | Monthly Profit | Adj. Lifetime | LTV Profit | vs Full Price ($40,320) | Lost    |
| -------- | -------------- | ------------- | ---------- | ----------------------- | ------- |
| 0%       | $2,880         | 14.0 mo       | $40,320    | —                       | —       |
| 10%      | $2,480         | 14.0 mo       | $34,720    | -$5,600                 | $5,600  |
| 15%      | $2,280         | 14.0 mo       | $31,920    | -$8,400                 | $8,400  |
| 20%      | $2,080         | 13.4 mo       | $27,920    | -$12,400                | $12,400 |
| 25%      | $1,880         | 12.9 mo       | $24,190    | -$16,130                | $16,130 |
| 30%      | $1,680         | 12.3 mo       | $20,700    | -$19,620                | $19,620 |

**"You're not losing $10K on this deal. You're losing $19,600 in lifetime profit."** That's the insight founders never see in a spreadsheet.

---

## Expected Value Calculation (Full Formula)

```
// EV without discount (annual, one-shot view)
ev_without = deal_size * (base_close_rate / 100)

// EV with discount (annual, one-shot view)
ev_with = discounted_deal * (close_prob_with / 100)

// EV without discount (LTV view — THE REAL NUMBER)
ev_ltv_without = ltv_profit_full * (base_close_rate / 100)

// EV with discount (LTV view)
ev_ltv_with = ltv_profit_adjusted * (close_prob_with / 100)

// Verdict based on LTV-adjusted EV
ev_ltv_diff = ev_ltv_with - ev_ltv_without

if (ev_ltv_diff > 1000)  → "DISCOUNT WORTH IT" (green)
if (ev_ltv_diff > 0)     → "MARGINAL — NEGOTIATE HARDER" (yellow)
if (ev_ltv_diff <= 0)    → "DON'T DISCOUNT" (red)
```

---

## The Magic Moment (When the Verdict Flips)

**Scenario 1: Negotiation stage (55% base), $4K/mo retainer**

| Discount | Close Prob | Annual EV | LTV Profit EV | vs Baseline | Verdict   |
| -------- | ---------- | --------- | ------------- | ----------- | --------- |
| 0%       | 55.0%      | $26,400   | $22,176       | —           | —         |
| 5%       | 63.9%      | $29,256   | $24,427       | +$2,251     | DISCOUNT  |
| 10%      | 69.8%      | $30,153   | $24,239       | +$2,063     | DISCOUNT  |
| 15%      | 73.5%      | $30,015   | $23,472       | +$1,296     | DISCOUNT  |
| 20%      | 75.5%      | $29,030   | $21,079       | -$1,097     | **DON'T** |
| 25%      | 73.6%      | $26,460   | $17,804       | -$4,372     | **DON'T** |
| 30%      | 71.1%      | $23,895   | $14,718       | -$7,458     | **DON'T** |

**The flip happens between 15-20%.** This is the demo moment and it's realistic — in B2B services, 15-20% is exactly where most pricing consultants draw the line.

**Scenario 2: Proposal stage (35% base), $4K/mo retainer — "early in the deal, should I lead with a discount?"**

| Discount | Close Prob | LTV Profit EV | vs Baseline | Verdict   |
| -------- | ---------- | ------------- | ----------- | --------- |
| 0%       | 35.0%      | $14,112       | —           | —         |
| 10%      | 51.1%      | $17,753       | +$3,641     | DISCOUNT  |
| 15%      | 55.2%      | $17,621       | +$3,509     | DISCOUNT  |
| 20%      | 56.6%      | $15,803       | +$1,691     | DISCOUNT  |
| 25%      | 54.9%      | $13,288       | -$824       | **DON'T** |

**Flip at ~23%.** Earlier deals have more room for discount because probability gains are bigger.

**Scenario 3: Verbal commit (80% base) — "they basically said yes, should I sweeten it?"**

| Discount | Close Prob | LTV Profit EV | vs Baseline | Verdict   |
| -------- | ---------- | ------------- | ----------- | --------- |
| 0%       | 80.0%      | $32,256       | —           | —         |
| 5%       | 84.5%      | $32,144       | -$112       | **DON'T** |
| 10%      | 87.0%      | $30,226       | -$2,030     | **DON'T** |

**Never discount at verbal stage.** The probability gain is tiny but the margin loss is real. This is the correct answer and the tool shows it instantly.

---

## Output Display (ALL update live as slider moves)

| Metric                | Value                     | Format                        |
| --------------------- | ------------------------- | ----------------------------- |
| Monthly Retainer      | $3,200 (was $4,000)       | Currency                      |
| Annual Deal           | $38,400 (was $48,000)     | Currency                      |
| Revenue Lost (annual) | -$9,600                   | Red                           |
| Gross Margin          | 65.0% (was 72.0%)         | Color gradient                |
| Monthly Profit        | $2,080 (was $2,880)       | Currency                      |
| Close Probability     | 75.5% (was 55.0%)         | Green if higher               |
| Client LTV            | $42,880 (was $56,000)     | Currency                      |
| **LTV Profit**        | **$27,872 (was $40,320)** | **Key number**                |
| **LTV Profit Lost**   | **-$12,448**              | **Red, the "oh shit" number** |
| Annual EV             | $29,030 (was $26,400)     | Currency                      |
| **LTV EV**            | **$21,079 (was $22,176)** | **The verdict driver**        |
| **LTV EV Difference** | **-$1,097**               | **Green/Yellow/Red**          |
| **Verdict**           | **DON'T DISCOUNT**        | **Bold, animated on flip**    |

**Charts (all update live):**

1. **EV curve:** X-axis = discount %, Y-axis = LTV Expected Value. Shows the peak (sweet spot) and the decline. A dot shows current position. This is THE key chart.
2. **Revenue vs Margin waterfall:** Shows how margin erodes faster than revenue (because COGS is fixed)
3. **LTV comparison:** Two stacked bars — full price LTV vs discounted LTV. The gap between them is the lost profit.
4. **Close probability curve:** Shows the rise, plateau, and decline from quality penalty

---

## Slider UI Spec

```
DEAL STAGE: [Discovery] [Proposal] [Negotiation*] [Verbal]
                                     ^^^ selected

DISCOUNT:
|================●-----------------------------|
0%              15%                           40%
              Current: 15%

VERDICT:  ✅ DISCOUNT WORTH IT (+$1,296 LTV EV)
```

- Discount slider: 0-40%, step 1
- Deal stage: 4 buttons (toggle), default = Negotiation
- As slider moves OR stage changes: ALL numbers and charts update in real-time
- Color: green (>$1K positive) → yellow ($0-$1K, marginal) → red (negative)
- Verdict text animates when it flips

---

## What the LLM Says

**When verdict = DISCOUNT WORTH IT:**

> "At 15% off, your retainer drops from $4,000 to $3,400/mo. Your close probability jumps from 55% to 73.5%. The math: you lose $8,400 in lifetime profit, but the probability gain more than covers it — expected lifetime value is $1,296 higher. **Take the discount, but don't go above 18%.** After that, the numbers turn against you."

**When verdict = DON'T DISCOUNT:**

> "At 20% off, you'd lose $12,400 in lifetime profit — and your margin drops from 72% to 65%. The close probability only goes from 55% to 75.5%, which isn't enough to compensate. **Don't discount.** Instead: offer a 90-day pilot at full rate with a performance guarantee, or bundle in an extra deliverable that costs you very little (like a monthly report)."

**When verdict = MARGINAL:**

> "You're right at the edge. The discount is barely positive — only $1,097 in expected lifetime value. **Counter-offer at 12% instead of 15%.** That gives you a comfortable buffer and still signals flexibility."

**At verbal stage:**

> "They've already said yes. **Any discount here is pure margin destruction.** If they're pushing for a discount at this stage, it's a buying tactic, not a real objection. Hold your price. Offer faster onboarding or a bonus deliverable instead."

---

## Demo Script for This Feature

**Judge says:** "What does a $4K/month retainer mean for my business?"

**LLM calls `deal_impact`:**

- MRR: $47K → $51K (+8.5%)
- Runway: 14.2 → 16.1 months
- Client LTV: $56,000

**Judge says:** "What if I offer them 15% discount to close faster?"

**LLM calls `simulate_pricing` with discount_pct=15, stage=negotiation**

**Slider appears at 15%. Charts show:**

- Retainer: $4,000 → $3,400
- Margin: 72% → 67%
- Close prob: 55% → 73.5%
- LTV EV: +$1,296 vs no discount
- **Verdict: DISCOUNT WORTH IT**

**Judge drags slider to 25%:**

- Charts update live
- Probability peaks and starts declining (quality penalty)
- LTV EV goes negative
- **Verdict flips to DON'T DISCOUNT (-$4,372)**
- "See that? Above 20%, the buyer starts questioning your quality. Your probability actually drops AND your margin is shot."

**Ivan says:** "Now change the deal stage to Verbal."

**Judge clicks Verbal:**

- Even at 5% discount: DON'T DISCOUNT
- "They already said yes. Every dollar off is pure waste."

---

## Implementation Notes for Attila

1. **Bidirectional:** Slider/stage change → `app.callServerTool("simulate_pricing", {deal_size, discount_pct, deal_stage})` → server computes → returns JSON → UI re-renders
2. **Debounce:** 100ms on slider, instant on stage toggle
3. **Chart.js:** `animation: { duration: 250 }` for smooth transitions
4. **Colors:** Green (#22c55e) for >$1K positive, Yellow (#eab308) for $0-$1K, Red (#ef4444) for negative
5. **The EV curve chart is the hero.** It shows the peak (sweet spot) visually — the judge can SEE the optimal discount point. Label it.
6. **Verdict flip animation:** Scale pulse + color change when crossing threshold
7. **Responsive:** Must look good in MCP App iframe (sandboxed, limited width)
8. **Math.exp:** Use `Math.exp(-0.10 * discount_pct)` for the probability curve. This is a standard diminishing returns model, nothing exotic.
