# GenAI Restriction Test

Automated tests that verify the Prompt Security browser extension correctly allows and blocks GenAI applications based on policy.

## Tests

| Scenario | Site | Expected |
|---|---|---|
| Positive | `chatgpt.com` | Allowed |
| Negative | `gemini.google.com` | Blocked |

## Prerequisites

- Node.js 20+
- A configured Prompt Security account (API domain + key)

## Setup

```bash
npm ci
npx playwright install chromium --with-deps
```

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

## Run Tests

```bash
# Default — headed browser, GUI credentials via extension popup
npm test

# Headless
HEADLESS=true npm test

# Programmatic credentials (skip popup UI)
CREDENTIALS_MODE=programmatic npm test
```

## CI

Tests run automatically on every push via GitHub Actions using Xvfb (virtual display) with headed Chrome — no `--headless=new` quirks.

Credentials are stored as repository secrets (`API_DOMAIN`, `API_KEY`).

To add secrets: **Settings → Secrets and variables → Actions → New repository secret**
