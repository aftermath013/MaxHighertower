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
You will receive: CLIENT NAME, CLIENT URL, LOB SCOPE, DELIVERY LOCATION, CHANNEL SCOPE, REQUESTED BY

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
    {"icon": "emoji", "name": "string", "description": "string — 2 sentences: who they are and what they need from CS. Use **bold** for key traits."}
  ],

  "cnxRole": [
    {"title": "string", "body": "string"},
    {"title": "string", "body": "string"},
    {"title": "string", "body": "string"}
  ],

  "painPoints": [
    {"title": "string", "severity": "HIGH|MED|LOW", "description": "string — 2-3 sentences from real complaints. Use **bold** for the core issue and ==highlight== for the most critical stat.", "source": "string — e.g. BBB 2024, Trustpilot, Reddit r/clientname"}
  ],

  "painSummary": {
    "whatCustomersSay": "string — 2-3 sentences. Use **bold** for the dominant pattern.",
    "csImplication": "string — 2-3 sentences on what this means for CNX agent design."
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

  "tiers": [
    {
      "badge": "T1",
      "badgeColor": "teal",
      "title": "string",
      "volume": "string — e.g. ~60%",
      "contactTypes": ["string", "string", "string"],
      "agentProfile": "string",
      "escalationTriggers": ["string", "string"]
    },
    {
      "badge": "T2",
      "badgeColor": "yellow",
      "title": "string",
      "volume": "string",
      "contactTypes": ["string", "string", "string"],
      "agentProfile": "string",
      "escalationTriggers": ["string", "string"]
    },
    {
      "badge": "T3",
      "badgeColor": "raspberry",
      "title": "string",
      "volume": "string",
      "contactTypes": ["string", "string"],
      "agentProfile": "string",
      "escalationTriggers": ["string"]
    }
  ],

  "kpis": [
    {"val": "string", "lbl": "string"},
    {"val": "string", "lbl": "string"},
    {"val": "string", "lbl": "string"},
    {"val": "string", "lbl": "string"},
    {"val": "string", "lbl": "string"},
    {"val": "string", "lbl": "string"},
    {"val": "string", "lbl": "string"},
    {"val": "string", "lbl": "string"}
  ],

  "discoveryItems": [
    {"icon": "emoji", "title": "string", "body": "string — 2 sentences on what CNX needs from the client"}
  ],

  "whyCnx": [
    {"title": "string", "body": "string — 2-3 sentences. Use **bold** for the strongest argument."},
    {"title": "string", "body": "string — 2-3 sentences."}
  ]
}
```

## CONTENT REQUIREMENTS

- **stats**: Revenue, employee count, founding year, HQ location (research from client URL)
- **catalog**: 4–8 rows covering the client's main product/service lines with real pricing
- **archetypes**: Exactly 6 customer personas relevant to this client's CS volume
- **cnxRole**: Title each box by the input: LOB Scope, Delivery Location, Channel Scope
- **painPoints**: Minimum 6. Severity based on complaint volume/impact. Source must be real.
- **journeyStages**: 5–7 stages. Each stage must have 3+ items in both whatTheyAreDoing and contactTriggers.
- **emotionType**: Must be exactly one of: excited, anxious, frustrated, relieved, satisfied
- **csOpportunity**: One row per journey stage. intervention = BPO-executable now. innovation = future/digital pitch.
- **agentProfile.profile**: Keep experience bar realistic. 6 months + field affinity is the default. Only raise the bar when genuinely justified.
- **hiring.mustHave**: Attainable by a strong candidate pool in DELIVERY LOCATION. Avoid requirements that shrink the pool unnecessarily.
- **competencies**: 4–6 rows based on what this client's customers actually need
- **tiers**: Exactly 3. Volume should sum to ~100%. Base on realistic contact type breakdown.
- **kpis**: Exactly 8. Use industry benchmarks for this client's sector.
- **discoveryItems**: 4–6 items covering what CNX still needs to finalize program design
