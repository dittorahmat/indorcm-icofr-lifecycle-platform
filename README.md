# IndoGRC Pro — ICOFR Lifecycle Platform

IndoGRC Pro is a production-grade web application that digitizes the ICOFR (Internal Control over Financial Reporting) lifecycle for BUMN (State-Owned Enterprises). It is explicitly designed to fulfill **Regulation SK-5/DKU.MBU/11/2024** by providing a standardized, transparent, and auditable platform covering the entire regulatory process.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dittorahmat/indorcm-icofr-lifecycle-platform)

## Overview

IndoGRC Pro centralizes the 5-step ICOFR lifecycle required for BUMN compliance:
1.  **Perancangan (Planning)**: Scoping significant accounts, building Risk Control Matrices (RCM), and mapping BPM.
2.  **Implementasi (Implementation)**: Self-assessments by process owners (CSA) with Line 2 validation.
3.  **Evaluasi (Evaluation)**: Independent testing (TOD/TOE) by internal audit with 6 mandatory attributes.
4.  **Remediasi (Remediation)**: Tracking deficiencies with aggregate impact analysis and compensating controls.
5.  **Pelaporan (Reporting)**: Fraud indicators (WBS) integration, management assessment, and CEO/CFO sign-off.

## Key Compliance Features

- **Standardized BPM**: Visual process mapping with regulatory legends (Oval Start/End, Hexagon Risk, Cylinder Archive) as per **Lampiran 3**.
- **Line 2 Validation**: Formal **"Test of One"** walkthrough for design validation with evidence upload requirement (**Bab III 4**).
- **RCM Change Approval**: Formal workflow for RCM/BPM updates requiring Lini 2 approval before effective as per **Lampiran 6**.
- **Automated Sample Size**: Dynamic calculator following **Table 22** with mandatory **Homogeneity Justification** (Bab V 1.3.a).
- **Equity Investee Monitoring**: Dedicated tracking for associate entities (Equity Method) as per **FAQ No. 5**.
- **External Assurance**: **Independent Audit Portal** for KAP partners to submit formal opinions with automated report drafting (**Bab VIII**).
- **Whistleblowing Integration**: Recap of fraud indicators to drive risk-based scoping (**Prinsip 14 & 15**).
- **11 BUMN Clusters**: Pre-loaded Risk Library for Energy, Food, Finance, Mining, and other sectors (**Lampiran 2**).
- **Digital Sign-off**: CEO & CFO **Sign & Lock** workflow with **Dynamic QR Code Verification** for formal report integrity (Appendix 11).
- **Governance Metrics**: Auditor **Cooling-off Period Validation** (Bab II) and cycle completion **KPI Dashboards**.

## Mock Data Context

**Current Demo Entity:** PT Batubara Nusantara Sejahtera (Fictional Coal Mining BUMN)

The application includes comprehensive mock data for coal mining industry scenario:
- **50-60 GL Accounts** specific to coal mining operations
- **8 RCMs** with BPM diagrams (Revenue, Production, Procurement, Fixed Assets, Environmental)
- **25 Controls** (Automated, Manual, MRC, ITGC)
- **7 Deficiencies** with realistic mining scenarios
- **22 Risks** for Industri Mineral dan Batubara cluster

For detailed mock data documentation, see [`docs/MOCK-DATA-COAL-MINING.md`](docs/MOCK-DATA-COAL-MINING.md).

## Technology Stack

### Frontend
- **Framework**: React 18+ (Vite), React Router 6.
- **State**: TanStack Query (Server), Zustand (Local).
- **UI/Diagrams**: ShadCN/UI + Tailwind CSS + **React Flow**.
- **Forms**: React Hook Form + Zod.

### Backend
- **Server**: Hono (API). Lokal/on-prem via `@hono/node-server` (`worker/serve-local.ts`, port `3001`); edge via Cloudflare Workers.
- **Persistence**: PostgreSQL (skema `icofr`) via Drizzle ORM — triple-driver: `postgres-js` (TCP on-prem langsung), `neon-http` (Workers stateless), `neon-serverless` Pool (WebSocket + transaksi). Lihat `worker/db/index.ts`.
- **Search**: pgvector HNSW (semantic) + `tsvector` GIN Lexeme FTS (korpus dokumen, config `indonesian`) + `pg_trgm` GIN Trigram Search (substring `ILIKE`). Detail: `docs/adr/0003-pg-trgm-for-substring-search.md`.

## Design Context

### Users
Corporate staff members responsible for ICOFR compliance. Their primary job is to audit their own internal financial reporting controls, document their business processes, and provide clear evidence of control effectiveness for financial statement integrity.

### Brand Personality
Confident, Efficient, Compliant.

### Aesthetic Direction
Corporate, State-Owned Enterprise (BUMN) professional standard. Clean, structured, and trustworthy, focusing on clarity of data and processes. Avoid overly decorative elements; prioritize utility and clear information hierarchy.

### Design Principles
1. **Clarity First**: Information must be legible and easy to find, especially for complex process maps and audit trails.
2. **Compliance-Led**: The design should reflect the rigors of regulatory requirements (SK-5/DKU.MBU/11/2024), emphasizing accountability and traceablity.
3. **Structured Efficiency**: Every interaction should support the user in completing their tasks with minimal friction, reflecting the professional nature of the SOE/BUMN context.
4. **Data Integrity**: Visual representations of financial data and control processes should be precise, clear, and unambiguous to ensure trust.

## Installation

1.  **Prerequisites**: Node.js 22+ (`engines` di `package.json`), `psql` client (untuk `db:extensions`), dan Bun (untuk `deploy.sh` VPS / entrypoint Docker).
2.  **Clone and Install**:
    ```bash
    git clone <repo-url>
    npm install
    ```
3.  **Setup**:
    - Run `npm run cf-typegen` to generate Worker types.
    - Configure `DATABASE_URL` (Postgres, lihat § Database & Extensions), lalu `npm run db:extensions`.

## AI Chatbot Assistant

IndoGRC Pro includes an AI-powered chatbot assistant to help you understand ICOFR regulations.

### Features

- **Smart Q&A**: Ask questions about SK-5/DKU.MBU/11/2024 and get instant answers
- **Context-Aware**: Remembers conversation history for follow-up questions
- **Regulation Reference**: Cites specific BAB and Pasal when relevant
- **Rate Limited**: 100 requests per day per user for fair usage

### Setup

1. **Get Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key

2. **Configure AI Settings**:
   - Open `wrangler.jsonc` (or `.dev.vars` for local development).
   - **Gemini (Default)**: You only need to set your API key.
     ```jsonc
     {
       "vars": {
         "GEMINI_API_KEY": "your-actual-api-key-here",
         "AI_PROVIDER": "gemini" // Optional, defaults to gemini
       }
     }
     ```
   - **On-Premise (OpenAI-Compatible)**: Set the provider to `openai-compatible` and point to your local server (e.g., Ollama or vLLM).
     ```jsonc
     {
       "vars": {
         "AI_PROVIDER": "openai-compatible",
         "AI_BASE_URL": "http://your-server-ip:11434/v1",
         "AI_CHAT_MODEL": "gemma4",
         "AI_EMBEDDING_MODEL": "nomic-embed-text"
       }
     }
     ```

3. **Deploy**:
   ```bash
   bun run deploy
   ```

### Usage

- Click the 🤖 **floating button** at bottom-right corner of Dashboard
- Type your question (e.g., "Apa itu Test of One?", "Jelaskan BAB III Pasal 5")
- Press Enter or click Send
- Chat history is automatically saved locally

### Model Information

- **Model**: Gemini 2.5 Flash Lite (`gemini-2.5-flash-lite`)
- **Knowledge Base**: SK-5/DKU.MBU/11/2024 (119 pages, 234K characters)
- **Language**: Bahasa Indonesia

### Troubleshooting

**Error: "GEMINI_API_KEY not configured"**
- Make sure you've set your API key in `wrangler.jsonc`
- Restart the development server after changing the key

**Error: "Rate limit exceeded"**
- You've reached 100 requests for today
- Wait until tomorrow or contact admin to increase limit

**Error: "Invalid GEMINI_API_KEY"**
- Check your API key is correct
- Ensure no extra spaces in the key
- Verify API key is active in Google AI Studio

**Slow responses**
- Check your internet connection
- Gemini API may be under high load
- Consider upgrading to Gemini API paid tier for faster responses

## On-Premise Deployment & Licensing

IndoGRC Pro supports offline, on-premise deployment using Docker. For enterprise stability and hardware binding, follow the instructions below.

### 1. Deployment via Docker Compose

Gunakan `docker-compose.yml` di repo (image `pgvector/pgvector:pg15` — wajib, karena menyediakan ekstensi `vector` + `pg_trgm`; `postgres:15-alpine` polos **tidak** cukup):

```yaml
services:
  db:
    image: pgvector/pgvector:pg15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=indouser
      - POSTGRES_PASSWORD=indopassword
      - POSTGRES_DB=indorcm_db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U indouser -d indorcm_db"]
  app:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - /etc/machine-id:/host_machine_id:ro
    environment:
      - DATABASE_URL=postgres://indouser:indopassword@db:5432/indorcm_db
      - LICENSE_PUBLIC_KEY=your_public_key_here
    depends_on:
      db:
        condition: service_healthy
```

Urutan boot (`docker-entrypoint.sh`): `db-extensions` → `drizzle-kit push` → seed admin (`scripts/run-seed.ts`, `admin@bumn.go.id`) → `server.js`. VPS non-Docker memakai `deploy.sh` (fetch/pull `--ff-only`, migrasi kondisional bila `worker/db|drizzle` berubah, `rsync dist/client/` → `/var/www/icofr`, `pm2`, health gate `/api/settings`).

### 2. System Activation

Upon first boot, the application will enter **Activation Mode**:
1. Open the application in your browser.
2. You will see a **Machine ID** (e.g., `HOST-abcd-1234`).
3. Copy this ID and send it to your vendor/administrator.
4. Paste the provided **License Key** into the activation form.
5. Once validated, the application will be fully unlocked.

### 4. Database & Extensions (WAJIB sebelum migrasi)

Satu-satunya sumber DDL adalah `drizzle/*.sql` versioned. Namun `CREATE EXTENSION` membutuhkan hak superuser/owner yang tidak dimiliki role aplikasi — jadi ekstensi disiapkan terpisah **sebelum** `drizzle-kit push`:

```bash
psql "$DATABASE_URL" -f scripts/db-extensions.sql
# atau:
npm run db:extensions
```

Isi: `vector` (dibutuhkan migrasi 0041/0042, RAG embeddings) + `pg_trgm` (dibutuhkan migrasi 0050, Trigram Search, ADR-0003). Idempoten (`IF NOT EXISTS`). Tanpa langkah ini, DB fresh gagal dengan `type "vector" does not exist` dan index trigram tidak terbentuk (query `ILIKE '%…%'` jatuh ke Seq Scan).

Verifikasi:

```bash
psql "$DATABASE_URL" -c "\dx"                                # vector + pg_trgm terdaftar
psql "$DATABASE_URL" -c "SELECT indexname FROM pg_indexes WHERE indexname LIKE '%trgm%';"
```

Alur rollout on-prem: `docker compose up` (entrypoint menjalankan extensions → push → seed otomatis) atau VPS: `deploy.sh` (extensions → conditional push → build → `pm2` + Apache `/var/www/icofr`).

### 3. Subscription Management

- **Warnings**: Starting 90 days before expiration, a notification banner will appear.
- **Urgent Notice**: Starting 7 days before expiration, a persistent modal will appear upon login.
- **Expiry**: Once expired, the system will lock and redirect all users to the activation page.

---

## Internal: License Generation (Vendor Only)

If you are the application vendor, use the included utility to generate keys:

1. **Generate Key Pair** (Once):
   ```bash
   bun run scripts/generate-license.ts gen-keys
   ```
2. **Sign a Client License**:
   ```bash
   bun run scripts/generate-license.ts sign
   ```
   Follow the prompts to enter the client's Machine ID and validity period.

## Development

-   **Start Dev Server**: `npm run dev` (Frontend: `http://localhost:3000`).
-   **Quality**: `npm run lint`, `npm run type-check` (`type-check:app` + `type-check:worker`), `npm run check:loc`.
-   **Test**: `npm test` (vitest).
-   **Build**: `npm run build` (`sync-guide` + `type-check` + vite build).
-   **DB**: `npm run db:extensions` (superuser, sebelum push), `npm run db:check` (gate drift skema vs `drizzle/meta`, wajib hijau), migrasi via `drizzle-kit push` setelah ubah `worker/db/schema.ts`.

## License
MIT License.
