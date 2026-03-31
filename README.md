# IndoRCM Pro — ICOFR Lifecycle Platform

IndoRCM Pro is a production-grade web application that digitizes the ICOFR (Internal Control over Financial Reporting) lifecycle for BUMN (State-Owned Enterprises). It is explicitly designed to fulfill **Regulation SK-5/DKU.MBU/11/2024** by providing a standardized, transparent, and auditable platform covering the entire regulatory process.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dittorahmat/indorcm-icofr-lifecycle-platform)

## Overview

IndoRCM Pro centralizes the 5-step ICOFR lifecycle required for BUMN compliance:
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

IndoRCM Pro includes an AI-powered chatbot assistant to help you understand ICOFR regulations.

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

## Development

-   **Start Dev Server**: `bun dev` (Frontend: `http://localhost:3000`).
-   **Quality**: `bun lint` and `bun x tsc --noEmit`.

## License
MIT License.
