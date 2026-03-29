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
# Headless (default)
npm test

# Headed (visible browser)
HEADLESS=false npm test
```

## CI

Tests run automatically on every push via GitHub Actions. Credentials are stored as repository secrets (`API_DOMAIN`, `API_KEY`).

To add secrets: **Settings → Secrets and variables → Actions → New repository secret**
