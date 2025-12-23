---
trigger: always_on
---

# LLM CODING RULES (STRICT) — Clean Code Principles 2025

You are a coding assistant for this repository. You MUST follow these rules strictly to improve maintainability, scalability, and performance. [web:116][web:155][web:141]
If a request conflicts with these rules, you MUST ask for clarification or propose the safest, simplest alternative. [web:116]

## 0) Change discipline (always)
- MUST keep changes minimal and localized; do not refactor unrelated code. [web:116]
- MUST preserve existing conventions (folder structure, naming, patterns) unless explicitly told to change them. [web:155]
- MUST NOT add dependencies unless explicitly approved. [web:116]
- MUST ensure the code compiles and tests pass (or provide the exact fix if tests fail). [web:155]

## 1) Readability first
- MUST choose clarity over cleverness; optimize for the next reader, not the fastest typer. [web:116]
- MUST use intention-revealing names (no ambiguous abbreviations for domain concepts). [web:116][web:118]
- MUST keep functions small and focused; one function should do one job and do it well. [web:118]
- MUST avoid deep nesting; prefer early returns and small helper functions. [web:118]

## 2) Structure for maintainability
- MUST keep “changes local”: design modules so a feature change affects one area, not many. [web:119]
- MUST make components replaceable/removable (low coupling, explicit contracts). [web:119][web:120]
- MUST refactor regularly to prevent code bloat and complexity growth over time. [web:116]
- MUST standardize patterns across the codebase to make refactoring/tooling easier and reduce cognitive load. [web:155]

## 3) DRY / KISS (pragmatic)
- MUST avoid duplication, but MUST NOT create abstractions that make code harder to understand. [web:116][web:129]
- MUST keep APIs small and stable; prefer fewer parameters and simpler data shapes. [web:120]
- SHOULD delete dead code instead of keeping “just in case” branches. [web:116]

## 4) Testing as design pressure
- MUST write code that is easy to test (pure functions, dependency injection at boundaries). [web:117][web:120]
- SHOULD add tests when changing behavior; avoid refactors without safety nets for risky modules. [web:120]
- MUST keep tests deterministic and independent (no order dependencies, no shared mutable global state). [web:120]

## 5) Error handling & invariants
- MUST fail loudly in development and fail safely in production (typed errors, predictable fallbacks). [web:120]
- MUST handle edge cases explicitly (null/undefined/empty states) instead of relying on implicit behavior. [web:120]
- MUST keep invariants obvious (validate inputs at boundaries, assert assumptions in critical paths). [web:120]

## 6) Performance without guesswork
- MUST avoid premature optimization; write clean code first, then optimize based on evidence. [web:141]
- MUST profile before optimizing and iterate (profile → targeted change → profile again). [web:141]
- MUST document performance-driven changes (what was measured, what improved, trade-offs). [web:141]

## 7) Code review expectations
- MUST produce changes that are understandable; reviewers should be able to reason about correctness and comprehension. [web:155]
- MUST keep code consistent with the codebase so it stays maintainable at scale. [web:159][web:155]
- SHOULD split large changes into smaller, reviewable CLs/PRs when possible. [web:155]

## 8) Output requirements (when you generate code)
- MUST list file paths to change/create.
- MUST provide final code (not diffs unless explicitly requested).
- MUST include short migration notes if your change affects public APIs or configs.
- MUST NOT include hidden reasoning or long explanations.
