You are generating structured content for a CNX-branded client program brief.

## OUTPUT RULES
- Return a single JSON object ONLY. No markdown. No explanation. No code fences. No text before or after the JSON.
- All fields are required. Do not use placeholder text or "[INSERT]" markers.
- Every pain point must cite a real source (BBB, Trustpilot, Reddit, Google Reviews, etc.)
- Base all content on research — do not invent facts.

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
    {"icon": "emoji", "name": "string", "description": "string — 2 sentences: who they are and what they need from CS"}
  ],

  "cnxRole": [
    {"title": "string", "body": "string"},
    {"title": "string", "body": "string"},
    {"title": "string", "body": "string"}
  ],

  "painPoints": [
    {"title": "string", "severity": "HIGH|MED|LOW", "description": "string — 2-3 sentences from real complaints", "source": "string — e.g. BBB 2024, Trustpilot, Reddit r/clientname"}
  ],

  "painSummary": {
    "whatCustomersSay": "string — 2-3 sentences summarising the dominant complaint pattern",
    "csImplication": "string — 2-3 sentences on what this means for CNX agent design"
  },

  "journeyStages": [
    {"name": "string", "emotion": "emoji", "emotionLabel": "string — e.g. Excited, Neutral, Frustrated, Angry", "triggers": ["string", "string", "string"], "channel": "string — e.g. Chat, Voice, Email"}
  ],

  "csOpportunity": [
    {"stage": "string", "intervention": "string — what CNX does at this stage"}
  ],

  "customerProfile": {
    "demographics": "string",
    "commStyle": "string",
    "expectations": "string",
    "techSavvy": "string"
  },

  "agentProfile": {
    "profile": "string",
    "languages": "string",
    "empathy": "string",
    "domainKnowledge": "string"
  },

  "competencies": [
    {"competency": "string", "customerNeed": "string", "cnxDelivery": "string", "fitScore": "High|Med|Low"}
  ],

  "hiring": {
    "mustHave": ["string", "string", "string"],
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
    {"title": "string", "body": "string — 2-3 sentences"},
    {"title": "string", "body": "string — 2-3 sentences"}
  ]
}
```

## CONTENT REQUIREMENTS

- **stats**: Revenue, employee count, founding year, HQ location (research from client URL)
- **catalog**: 4–8 rows covering the client's main product/service lines with real pricing
- **archetypes**: Exactly 6 customer personas relevant to this client's CS volume
- **cnxRole**: Title each box by the input: LOB Scope, Delivery Location, Channel Scope
- **painPoints**: Minimum 6. Severity based on complaint volume/impact. Source must be real.
- **journeyStages**: 5–7 stages (e.g. Awareness → Purchase → Onboarding → Usage → Support → Loyalty → Churn Risk)
- **csOpportunity**: One row per journey stage
- **competencies**: 4–6 rows based on what this client's customers actually need
- **tiers**: Exactly 3. Volume should sum to ~100%. Base on realistic contact type breakdown.
- **kpis**: Exactly 8. Use industry benchmarks for this client's sector (retail, tech, fintech, etc.)
- **discoveryItems**: 4–6 items covering what CNX still needs to finalize program design
