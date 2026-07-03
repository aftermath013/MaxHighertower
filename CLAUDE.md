# CNX Client Brief Builder

## What This App Does
A web app for Concentrix ops and sales teams to generate structured, CNX-branded client program briefs. Users submit a form with a client URL and program details, an approval workflow gates AI generation, Claude generates a 5-page HTML brief, and the output is stored and accessible via a shareable link.

## Stack
- **Frontend**: Azure Static Web Apps (HTML/CSS/JS — no framework)
- **API**: Azure Functions (Node.js 18+) — lives in `/api` folder
- **AI**: Azure AI Foundry — Claude Sonnet (endpoint + key in env vars)
- **Storage**: Azure Blob Storage — stores generated HTML briefs
- **Database**: Azure Table Storage — project records and approval queue
- **Auth**: Azure Static Web Apps built-in auth (Microsoft/Entra ID)
- **Notifications**: Power Automate — watches Table Storage, pings Teams on new requests

## Project Structure
```
cnx-brief-builder/
├── CLAUDE.md
├── .claude/
│   └── settings.json
├── src/                        # Frontend static files
│   ├── index.html              # Submission form (public)
│   ├── dashboard.html          # Approval dashboard (Max only)
│   ├── brief.html              # Brief viewer (authenticated)
│   ├── css/
│   │   └── styles.css          # CNX brand tokens
│   └── js/
│       ├── form.js             # Form submission logic
│       ├── dashboard.js        # Approval queue logic
│       └── brief.js            # Brief viewer + PDF/edit logic
├── api/                        # Azure Functions
│   ├── submit-request/         # Saves form data as pending
│   │   └── index.js
│   ├── approve-request/        # Triggers generation (admin only)
│   │   └── index.js
│   ├── generate-brief/         # Calls Claude, saves to Blob
│   │   └── index.js
│   ├── get-projects/           # Lists all projects from Table Storage
│   │   └── index.js
│   └── get-brief/              # Returns brief HTML by project ID
│       └── index.js
├── staticwebapp.config.json    # SWA routing + auth rules
├── host.json                   # Azure Functions config
└── package.json
```

## Key Rules

### Never do these
- Never put API keys or connection strings in frontend JS
- Never call Claude directly from the frontend — always through the approve-request Function
- Never skip the approval check in generate-brief — Claude is only called when `status === 'approved'`
- Never store PII beyond name + email in Table Storage

### Always do these
- All env vars go in Azure Function App Settings (local: `local.settings.json`, gitignored)
- Every Function returns consistent JSON: `{ success: bool, data: {}, error: string }`
- Validate all form inputs server-side in the Function, not just client-side
- Add CORS headers in `staticwebapp.config.json`, not in Function code — SWA handles it

## Environment Variables (local.settings.json — never commit)
```json
{
  "Values": {
    "AZURE_AI_ENDPOINT": "https://your-foundry-endpoint.azure.com/",
    "AZURE_AI_KEY": "your-key-here",
    "AZURE_AI_MODEL": "claude-sonnet-4-6",
    "STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=...",
    "BLOB_CONTAINER": "briefs",
    "TABLE_NAME": "projects",
    "ADMIN_USER_ID": "max-entra-object-id"
  }
}
```

## Data Schema

### Table Storage — projects table
| Field | Type | Notes |
|---|---|---|
| PartitionKey | string | `"projects"` |
| RowKey | string | UUID — project ID |
| clientName | string | |
| clientUrl | string | |
| lobScope | string | e.g. "Full-Stack CS + Tech" |
| deliveryLocation | string | e.g. "Philippines" |
| channelScope | string | e.g. "TBD" |
| requestedBy | string | User display name |
| requestedByEmail | string | |
| status | string | `"pending"` → `"approved"` → `"generated"` → `"rejected"` |
| blobUrl | string | Set after generation |
| createdAt | datetime | |
| approvedAt | datetime | |
| generatedAt | datetime | |

### Blob Storage — briefs container
- One blob per project: `{projectId}.html`
- Public read access on container (link = access)
- Blob name is the project RowKey

## Approval Flow
```
POST /api/submit-request
  → validate inputs
  → save to Table Storage (status: pending)
  → return { projectId }

POST /api/approve-request  ← admin only (check ADMIN_USER_ID)
  → update Table Storage status to "approved"
  → call generate-brief internally

POST /api/generate-brief   ← never called directly by frontend
  → check status === "approved"
  → call Azure AI Foundry (Claude) with client data + brief prompt
  → save HTML to Blob Storage
  → update Table Storage: status = "generated", blobUrl = blob URL
  → return { blobUrl }

GET /api/get-projects      ← admin only
  → return all rows from Table Storage, sorted by createdAt desc

GET /api/get-brief?id={}
  → return blobUrl for that project ID
```

## What the AI Does (Brief Generation)

This is the core feature. When a request is approved, the app calls Claude via Azure AI Foundry to generate a complete 5-page HTML program brief. Claude Code must understand this flow to build it correctly.

### What Claude receives (inputs)
The generate-brief Function sends these to the AI:
- `clientName` — brand name
- `clientUrl` — Claude will instruct the AI to fetch this URL for product/service info
- `lobScope` — e.g. "Full-Stack CS + Tech + Insurance"
- `deliveryLocation` — e.g. "Philippines"
- `channelScope` — e.g. "Voice + Chat" or "TBD"
- `requestedBy` — who requested it (shown in brief footer)

### What Claude produces (output)
A single, complete HTML file. Nothing else — no markdown, no explanation, no code fences. The HTML must:
- Be fully self-contained (all CSS and JS inline)
- Follow the CNX New Realities brand system exactly (colors, typography, layout — see Brand Tokens)
- Include the dual view mode system (Share View default + Web View toggle)
- Include the inline edit + autosave + export system
- Include mobile responsive breakpoints (900px, 480px, 380px)
- Be openable directly in any browser with no dependencies

### The 5 pages the AI generates
| Page | Content |
|---|---|
| 01 Brief | Client overview, product/service catalog table, 6 customer archetypes, CNX role |
| 02 Pain Points | Real customer complaints sourced via web search — severity HIGH/MED/LOW, cited |
| 03 Journey Map | 5–7 stage customer lifecycle, contact triggers per stage, emotion state |
| 04 Agent Match | Customer profile vs CNX agent profile side-by-side, competency fit table, hiring criteria |
| 05 Ops Framework | Tiered routing (T1/T2/SME/T3), KPI targets, open discovery items |

### How the AI researches the client
Before generating any content, the AI must:
1. Fetch the client URL to extract product catalog, pricing, target customer
2. Search for "[clientName] customer complaints reviews [year]"
3. Search for "[clientName] BBB complaints" or "[clientName] Trustpilot"
4. Use findings to populate pain points with real sources, not invented ones

### System prompt location
`api/generate-brief/prompt.md` — this file contains the full generation instructions passed as the system prompt to Claude. It references the HTML template structure and CNX brand rules. Claude Code should read this file before modifying any generation logic.

### System prompt structure (summary)
```
You are generating a CNX-branded client program brief as a single HTML file.

INPUTS: {clientName}, {clientUrl}, {lobScope}, {deliveryLocation}, {channelScope}

STEP 1 — Research: fetch {clientUrl}, search for customer reviews and complaints.
STEP 2 — Generate: produce a complete 5-page HTML brief using the structure below.
STEP 3 — Output: return raw HTML only. No markdown. No explanation. No code fences.

[Full HTML template and CNX brand rules follow...]
```

### AI call structure in generate-brief/index.js
```js
const response = await fetch(process.env.AZURE_AI_ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-key': process.env.AZURE_AI_KEY
  },
  body: JSON.stringify({
    model: process.env.AZURE_AI_MODEL,
    max_tokens: 16000,         // briefs are long — do not reduce
    messages: [
      { role: 'system', content: systemPrompt },  // from prompt.md
      { role: 'user', content: buildUserMessage(formData) }
    ]
  })
});
```

### Token usage per brief (approximate)
- Input: ~3,000–5,000 tokens (system prompt + form data + research results)
- Output: ~8,000–12,000 tokens (full HTML)
- Total per generation: ~15,000 tokens

This is why the approval gate exists — each generation costs real tokens. No approval = no API call.

### Error handling for generation
- If AI returns empty or malformed HTML → set status to `"failed"`, do not save to Blob
- If AI call times out (>30s) → retry once, then fail
- If blob save fails → set status to `"failed"`, log error
- Always update Table Storage status — never leave a record stuck at `"approved"`

## Auth
- `staticwebapp.config.json` gates `/dashboard.html` and `/api/approve-request` to authenticated users only
- Admin check (approve, get-projects) compares `x-ms-client-principal` header against `ADMIN_USER_ID` env var
- For local dev: skip auth check when `NODE_ENV === 'development'`

## Local Dev Commands
```bash
# Install dependencies
npm install

# Run SWA CLI (serves frontend + functions together)
npx @azure/static-web-apps-cli start src --api-location api

# Run functions only
cd api && func start

# Deploy to Azure
npx @azure/static-web-apps-cli deploy
```

## CNX Brand Tokens (reference for any UI work)
```css
--cnx-blue: #003D5B;
--cnx-teal: #25E2CC;
--cnx-jade: #007380;
--cnx-yellow: #FBCA18;
--cnx-orange: #FF8400;
--cnx-raspberry: #CC3262;
--cnx-charcoal: #2A2B2C;
```
Font: Montserrat (Google Fonts). Always use these — no deviation.

## What Claude Code Should NOT Touch
- `local.settings.json` — env vars, never commit
- `.azure/` — deployment state managed by SWA CLI
- Generated blob files in storage — read-only after creation
- `staticwebapp.config.json` auth rules — ask before modifying
