---
description: How to maintain and update CHANGELOG.md for AI-MarkDone
---

# Changelog Maintenance Workflow

> **Version**: 1.0.0
> **Last Updated**: 2026-01-12
> **Purpose**: Defines the standard procedure for updating `CHANGELOG.md`.

---

## 📋 Core Principles

1.  **Product-Centric**: Only document changes that affect the **end-user** experience (Features, UI updates, Bug fixes).
2.  **No Internal details**: Do not document refactoring, tests, docs, or internal tooling changes unless they have a direct user impact (e.g., significant performance boost).
3.  **Language**: **English Only**.
4.  **Format**: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## 🔄 Workflow Steps

### 1. Identify Changes
Review your work and categorize changes into:
- **Added**: New features (e.g., "Added Claude Support", "Added Bookmark Export").
- **Changed**: Changes in existing functionality (e.g., "Renamed button X to Y").
- **Fixed**: Bug fixes (e.g., "Fixed toolbar not showing on dark mode").
- **Ignored**: Documentation, Tests, Refactoring (unless user-facing).

### 2. Update CHANGELOG.md
Locate the `[Unreleased]` section at the top. If it doesn't exist, create it.

```markdown
## [Unreleased]

### Added
- **Feature Name**: Brief description of the benefit.

### Changed
- **Component**: Description of change.

### Fixed
- **Component**: Description of fix.
```

### 3. Release Preparation (Version Bump)
When preparing for a release (`/release` workflow):
1. Rename `[Unreleased]` to `[Version] - YYYY-MM-DD`.
2. Ensure verify semver rules.

---

## ✅ Examples

### Good (User Focused)
> - **Theme System**: Fixed theme detection regression to ensure toolbar colors match the platform theme.

### Bad (Internal Detail)
> - **Refactor**: Decoupled ThemeManager from platform logic using Adapter pattern.
> - **Docs**: Updated PLATFORM_ADAPTATION_GUIDE.md.

---

## 🚫 Critical Rules

- **DO NOT** mention file names or internal function names.
- **DO NOT** mention documentation updates.
- **DO NOT** mention test cases.
- **ALWAYS** use the correct category (Added/Changed/Fixed).
