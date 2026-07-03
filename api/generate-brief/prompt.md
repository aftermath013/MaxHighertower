You are generating structured content for a CNX-branded client program brief.

## OUTPUT RULES
- Return a single JSON object ONLY. No markdown. No explanation. No code fences. No text before or after the JSON.
- All fields are required. Do not use placeholder text or "[INSERT]" markers.
- Every pain point must cite a real source (BBB, Trustpilot, Reddit, Google Reviews, etc.)
- Base all content on research — do not invent facts.

## LANGUAGE
- All content must be written in English only.
- Where culturally relevant, include context inline — e.g. "American consumers expect same-day resolution" or "Philippine agents bring strong cultural alignment with US customers." Do not switch to any other language.

## TEXT FORMATTING
Use these markers inside string values to add emphasis. Keep it selective — only the most important terms per section:
- `**text**` — bold a key metric, product name, or critical term (e.g. `**suction failure**`, `**$499**`, `**94% CSAT**`)
- `==text==` — teal highlight for a standout insight or critical callout (e.g. `==highest complaint volume==`, `==priority hire==`)
- Emojis — use inline freely in descriptions and labels to add flavor (e.g. "💸 Pricing complaints dominate...")

## INPUTS
You will receive: CLIENT NAME, CLIENT URL, SCOPE/SUPPORT, DELIVERY LOCATION, CHANNEL SCOPE, REQUESTED BY, and optionally BRIEF NAME and REMARKS/SPECIFIC BUSINESS.

If REMARKS/SPECIFIC BUSINESS is provided, treat it as the primary context lens for the entire brief — it describes the specific segment, opportunity, or angle CNX is pitching. Weave it into all relevant sections (scope, archetypes, pain points, agent profile, discovery items).

## STEP 1 — RESEARCH
Before generating content:
1. Fetch the CLIENT URL — extract product/service catalog, pricing tiers, target customer demographics
2. Search "[CLIENT NAME] customer complaints reviews 2025"
3. Search "[CLIENT NAME] BBB complaints" or "[CLIENT NAME] Trustpilot reviews"

## STEP 2 — GENERATE
Return exactly this JSON structure, all fields populated:

```
{
  "clientName": "string — official brand name",
  "clientTagline": "string — one sentence describing what the client does",

  "stats": [
    {"val": "string", "lbl": "string"},
    {"val": "string", "lbl": "string"},
    {"val": "string", "lbl": "string"},
    {"val": "string", "lbl": "string"}
  ],

  "catalog": [
    {"product": "string", "description": "string", "priceRange": "string", "targetSegment": "string"}
  ],

  "archetypes": [
    {"icon": "emoji", "name": "string", "description": "string — 1 sentence: who they are and what they need from CS. Use **bold** for key traits."}
  ],

  "cnxRole": [
    {"title": "string", "body": "string"},
    {"title": "string", "body": "string"},
    {"title": "string", "body": "string"}
  ],

  "painPoints": [
    {"title": "string", "severity": "HIGH|MED|LOW", "description": "string — 1-2 sentences from real complaints. Include how widespread or frequent this issue is (e.g. 'hundreds of reviews mention...', 'the most common complaint is...'). Use **bold** for the core issue.", "source": "string — e.g. BBB 2024, Trustpilot, Reddit r/clientname"}
  ],

  "painSummary": {
    "whatCustomersSay": "string — 1 sentence. Use **bold** for the dominant pattern.",
    "csImplication": "string — 1 sentence on what this means for CNX agent design."
  },

  "journeyStages": [
    {
      "name": "string — stage name e.g. Awareness, Purchase, Onboarding, Usage, Support, Loyalty, Churn Risk",
      "whatTheyAreDoing": ["string — specific action/behavior", "string", "string"],
      "contactTriggers": ["string — specific reason they'd contact CS", "string", "string"],
      "emotion": "emoji",
      "emotionLabel": "string — short label e.g. Excited but overwhelmed, Anxious and confused, Frustrated",
      "emotionType": "excited|anxious|frustrated|relieved|satisfied"
    }
  ],

  "csOpportunity": [
    {
      "stage": "string",
      "intervention": "string — what CNX agents actually do here (CS, Tech, Insurance, Sales BPO work only). Use **bold** for key action.",
      "innovation": "string — automation, AI, or digital deflection opportunity CNX can pitch. Sky is the limit — chatbots, predictive routing, knowledge bots, sentiment detection, proactive outreach, etc."
    }
  ],

  "customerProfile": {
    "demographics": "string",
    "commStyle": "string",
    "expectations": "string",
    "techSavvy": "string"
  },

  "agentProfile": {
    "profile": "string — use realistic BPO hiring standards. Default to 6 months CS or related field experience unless the role genuinely demands more. Prefer 'relevant field affinity' over strict years. Only require 2+ years if technically justified (e.g. licensed insurance adjuster).",
    "languages": "string",
    "empathy": "string",
    "domainKnowledge": "string"
  },

  "competencies": [
    {"competency": "string", "customerNeed": "string", "cnxDelivery": "string", "fitScore": "High|Med|Low"}
  ],

  "hiring": {
    "mustHave": ["string — realistic, attainable requirement", "string", "string"],
    "niceToHave": ["string", "string", "string"],
    "redFlags": ["string", "string", "string"]
  },

  "discoveryItems": [
    {"icon": "emoji", "title": "string", "body": "string — 2 sentences on what CNX needs from the client"}
  ],

  "whyCnx": [
    {"title": "string", "body": "string — 1-2 sentences. Use **bold** for the strongest argument."},
    {"title": "string", "body": "string — 1-2 sentences."}
  ]
}
```

## CONTENT REQUIREMENTS — KEEP CONCISE (token budget is limited)

- **stats**: Exactly 4. Revenue, employee count, founding year, HQ location.
- **catalog**: 4–6 rows. One sentence per description. Real pricing.
- **archetypes**: Exactly 5. One sentence per description.
- **cnxRole**: Title each box by the input: Scope/Support, Delivery Location, Channel Scope. 1-2 sentences each.
- **painPoints**: Exactly 5. Sort by complaint volume/frequency — most-reported issues first. Severity based on complaint volume/impact. 1-2 sentences per description. Source must be real.
- **painSummary**: 1 sentence each field.
- **journeyStages**: Exactly 5 stages. Exactly 2 items in whatTheyAreDoing. Exactly 2 items in contactTriggers.
- **emotionType**: Must be exactly one of: excited, anxious, frustrated, relieved, satisfied
- **csOpportunity**: One row per journey stage. intervention = 1 sentence BPO-executable action. innovation = 1 sentence future/digital pitch.
- **agentProfile.profile**: Keep experience bar realistic. 6 months + field affinity is the default. Only raise the bar when genuinely justified. 1 sentence.
- **agentProfile** (all fields): 1 sentence each.
- **hiring.mustHave**: Exactly 3 items. Short phrase, not a sentence.
- **hiring.niceToHave**: 3–6 items. Go all out — include relevant personality traits, life experience, cultural affinity, personal background that genuinely helps (e.g. parenting experience for baby/maternity products, prior user of the product, hobbyist in the domain, multilingual background, field affinity). Short phrases.
- **hiring.redFlags**: Exactly 3 items. Short phrase, not a sentence.
- **competencies**: Exactly 4 rows. 1 sentence per cell.
- **discoveryItems**: Exactly 4. 1-2 sentences per body — include the specific detail or context that makes the discovery item actionable.
- **whyCnx**: Exactly 2. 1-2 sentences each.
