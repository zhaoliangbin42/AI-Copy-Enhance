# AGENTS.md (Chrome Extension / MV3)

## Project summary
- Project: AI-Markdone
- Type: Chrome Extension (Manifest V3)
- Primary languages: TypeScript, HTML, CSS
- Target: Chrome Web Store (MV3)

## Non-negotiables (must follow)
1) Never expand permissions without an explicit ADR update (docs/adr/) and a permission matrix update (docs/security/permissions.md).
2) Apply principle of least privilege:
   - Prefer narrow host_permissions.
   - Avoid wildcard hosts unless strictly required and justified.
3) Treat content scripts as untrusted:
   - Validate/sanitize all message payloads from content scripts.
   - Restrict privileged actions to the service worker.
4) Enforce CSP rules compatible with MV3 (no remote code execution policies).
5) All user-facing behavior changes require:
   - Updated docs/spec and release notes section in PR description.
   - At least one automated test (unit or e2e) covering the change.

## Repository map (where to look)
- manifest: /manifest.json
- service worker: /src/background/service-worker.ts
- content scripts: /src/content/ (entry: /src/content/index.ts)
- bookmarks: /src/bookmarks/
- UI components (content): /src/content/components/
- shared utilities: /src/utils/
- shared types: /src/types/
- styles: /src/styles/
- docs (PRD/SPEC/ADR/Runbook): /docs/
- prompts for Codex runs: /prompts/

## Setup commands (authoritative)
> If commands differ from reality, update this file in the same PR.

- Install deps: `npm install` (or `npm ci`)
- Dev build (watch): `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`
- Typecheck: `npm run type-check`
- Parser tests: `npm run test:parser`
- Production parser tests: `npm run test:prod`

## Coding conventions
- TypeScript: strict typing; avoid `any` unless justified in code comments.
- Prefer small, pure functions in /src/utils/; keep side effects in service worker.
- Messaging:
  - Define message payload shapes near senders/receivers.
  - Validate payloads at the receiver boundary (service worker and content script).
- Storage:
  - Use `chrome.storage` (see /src/bookmarks/storage/).
  - Avoid `localStorage` in service worker contexts.

## Security guardrails (extension-specific)
- Permissions:
  - Any change to `permissions` or `host_permissions` must include:
    - docs/adr/ADR-xxxx-permissions.md (new or updated)
    - docs/security/permissions.md updated matrix + rationale
- CSP:
  - Keep MV3-compatible CSP in manifest.json.
  - Do not add inline scripts in extension pages.
- Data handling:
  - Do not log sensitive user data.
  - If telemetry exists, document it in SECURITY.md and docs/security/threat-model.md.

## How to work on a task (workflow)
1) Read the relevant PRD/SPEC (docs/prd, docs/spec) and summarize acceptance criteria.
2) Write or update tests first where feasible.
3) Implement with minimal diff; keep PRs small.
4) Run `pnpm check` locally before finalizing.
5) Produce a PR summary with:
   - What changed
   - Why
   - Risks/rollout notes
   - Tests executed (paste command output snippets)

## When uncertain
- Ask a clarifying question in the PR (as a TODO list) and propose 2–3 options with tradeoffs.
- Do not guess permissions, CSP, or security-sensitive behavior.
