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
- **Server**: Hono (Edge-ready API).
- **Persistence**: Cloudflare Durable Objects (IndexedEntity pattern).
- **Edge-Optimized**: Native Cloudflare Workers deployment.

## Installation

1.  **Prerequisites**: Node.js 18+ or Bun.
2.  **Clone and Install**:
    ```bash
    git clone <repo-url>
    bun install
    ```
3.  **Setup**:
    - Run `bun cf-typegen` to generate Worker types.

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

2. **Configure API Key**:
   - Open `wrangler.jsonc`
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:
   ```jsonc
   {
     "vars": {
       "GEMINI_API_KEY": "your-actual-api-key-here"
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

Create a `docker-compose.yml` file or use the provided one:

```yaml
services:
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=your_secure_password
  app:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - /etc/machine-id:/host_machine_id:ro
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/db
      - LICENSE_PUBLIC_KEY=your_public_key_here
    depends_on:
      - db
```

### 2. System Activation

Upon first boot, the application will enter **Activation Mode**:
1. Open the application in your browser.
2. You will see a **Machine ID** (e.g., `HOST-abcd-1234`).
3. Copy this ID and send it to your vendor/administrator.
4. Paste the provided **License Key** into the activation form.
5. Once validated, the application will be fully unlocked.

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

-   **Start Dev Server**: `bun dev` (Frontend: `http://localhost:3000`).
-   **Quality**: `bun lint` and `bun x tsc --noEmit`.

## License
MIT License.
