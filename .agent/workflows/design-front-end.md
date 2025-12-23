---
description: Front-end design workflow that strictly follows workspace rules and .agent/rules/design-rules.md
---

Berikut template Antigravity workflow yang sesuai tampilan di screenshot (form “Description” + “Content”) dan memastikan Agent selalu memuat + mematuhi semua workspace rules, khususnya design-rules.md.
​
Workflows harus berupa file .md di folder .agent/workflows/ dan diawali YAML frontmatter berisi description.
​
Workflow bisa dipanggil lewat slash command (mis. /design-front-end) sesuai nama file.
​

Workflow 1 — design-front-end.md
Simpan sebagai: .agent/workflows/design-front-end.md (sesuai yang terlihat di screenshot).
​

text
---
description: Front-end design workflow that strictly follows workspace rules and .agent/rules/design-rules.md
---

1) Load & confirm rules (STRICT)
- You MUST follow ALL workspace rules found in `.agent/rules/` and MUST treat them as non-negotiable.
- You MUST also follow the front-end design constraints in `.agent/rules/design-rules.md`.
- If any requested change conflicts with the rules, you MUST propose a compliant alternative or ask a clarification question.

2) Discover rule files
// turbo
Run:
`ls -la .agent/rules && ls -la .agent/workflows`

3) Read rules before doing anything else
- Open and read ALL `.md` files inside `.agent/rules/` (do not assume contents).
- Pay special attention to:
  - `.agent/rules/design-rules.md`
  - Any Next.js/React rules
  - OWASP/security rules
  - Clean code/maintainability rules

4) Restate constraints briefly
- In 5–10 bullets, restate the rules that most directly affect the task.
- Include: architecture constraints, UI/UX constraints, accessibility/performance constraints, and security constraints.

5) Ask for missing inputs (BLOCKING)
If any of these are unknown, ask the user:
- Target pages/screens and user roles
- Primary user goals and success metrics
- Brand tokens (colors, typography), or existing design system
- Responsiveness requirements (breakpoints)
- Accessibility baseline (WCAG level if any)
- Data sources (API/DB), loading states, empty states, error states

6) Produce a design spec (Markdown)
You MUST produce a design plan that includes:
- Information architecture (routes/pages)
- Component inventory (reusable components)
- State model (server/client state, form state)
- Data fetching + caching strategy (if relevant)
- UI states: loading, empty, error, unauthorized
- Accessibility checklist (keyboard nav, focus order, aria labels where needed)
- Performance checklist (image usage, bundle impact, rendering boundaries)

7) Implementation plan (repo-aligned)
- Propose the exact files to create/modify (paths).
- Keep changes minimal and localized.
- Do NOT introduce new dependencies unless explicitly approved.

8) Execute changes safely
- Make the smallest code edits that satisfy the design spec.
- Add/update types, tests, and documentation only where necessary.
- Ensure output matches project conventions.

9) Self-check against rules
Before final output, you MUST verify:
- No rule violations (security + design + code style)
- No secrets exposed
- No new dependencies added without approval
- Changes compile and are consistent with project patterns
