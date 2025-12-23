---
trigger: model_decision
description: ALWAYS follow these UI/UX Coding Rules (Frontend Only) for every request that involves creating, modifying, or reviewing any frontend, UI design, or UX design for this project. This includes: pages, layouts, components, styling, responsive behavior, 
---

# SLR Tracker — UI/UX Coding Rules (Frontend Only)

Goal: build a **clean, minimal, easy-to-use** UI that is **simpler than Excel** for daily SLR work (e.g., add 5 papers/day).  
Scope: **frontend UI only** (layout, components, interaction, responsiveness, accessibility).

---

## 1) Core UX Principles (Non-Negotiable)

1. **Faster than Excel**
   - Every common action must be achievable in fewer steps than a spreadsheet:
     - Add paper
     - Update status
     - Edit extraction fields
     - Export CSV
2. **Minimal UI, maximum clarity**
   - No heavy branding, no fancy effects.
   - Neutral, grayscale UI (white/gray) is fine.
3. **Consistency over creativity**
   - Same spacing, same typography scale, same component variants everywhere.
4. **Everything is readable**
   - Strong hierarchy: titles > section headers > labels > helper/meta.
5. **Accessibility by default**
   - Keyboard-first, visible focus, adequate contrast.

---

## 2) Use a Component Library (Required)

To avoid reinventing UI, the app must use a proven library. Choose ONE:
- **shadcn/ui + Tailwind** (recommended for clean SaaS UI)
- **Mantine**
- **MUI**
- **Chakra UI**

Rules:
- Prefer library defaults; customize minimally.
- Do not build custom components unless necessary.

---

## 3) Visual System (Simple Neutrals)

### 3.1 Colors (Neutral-First)
- Background: `#F8FAFC` or library default
- Surface: `#FFFFFF`
- Border: `#E5E7EB`
- Text primary: `#111827`
- Text secondary: `#4B5563`

Optional accent (only for primary CTA and links):
- Primary: `#3A59D1` (or library default primary)

Rules:
- Grayscale UI is acceptable.
- Avoid using many colors for categories/tags; use text + subtle badges.

### 3.2 Typography
- Use the library’s default clean sans font or Poppins if already set globally.
- Keep it simple:
  - Page title (H1)
  - Section title (H2)
  - Body
  - Caption/meta

Rule:
- Do not introduce more than 5 font sizes.

### 3.3 Spacing
Use an 8pt system:
- 8, 16, 24, 32… (or the library’s spacing scale)

Rule:
- No random margin/padding values.

---

## 4) Layout Rules (Always Predictable)

### 4.1 App Shell
- Top bar: app name + project selector + primary actions
- Main area: list/table of studies + filters
- Optional side panel: study detail editor (recommended)

Rules:
- Navigation must be obvious and never hidden on desktop.
- Primary actions should stay near the top-right or top area.

### 4.2 Page Structure (Every screen)
1. Page title + short helper text
2. Primary CTA
3. Filters/search
4. Main content (table/list)
5. Empty/loading/error states

---

## 5) The “Excel Replacement” Rules (Speed First)

### 5.1 Quick Add is mandatory
- Adding a paper must support **minimal fields**:
  - Title
  - Year
  - DOI or URL
- Everything else is optional during initial entry.

Rule:
- The “Add Paper” flow must take **< 30 seconds** for minimal input.

### 5.2 Inline editing is preferred
For frequently changed fields:
- Status
- Relevance score
- Year
- Venue (optional)

Use:
- inline dropdowns / editable cells
- or a right-side detail panel that doesn’t navigate away

Rule:
- Avoid forcing full-page navigation to edit one field.

### 5.3 One-screen extraction editing
Extraction fields must be editable without hunting:
- problem, solution, techniques, evaluation, results
- strengths, limitations, gap, adoption

Rule:
- Provide a structured editor (sections + textarea), not a giant unstructured blob.

### 5.4 Keyboard-friendly
- `Enter` saves/creates
- `Esc` closes dialogs/panels
- Table navigation must not break Tab order

---

## 6) Components Rules (Use Library Components)

### 6.1 Table (Primary UI)
The study list should be a table with:
- Title (primary)
- Year
- Status (dropdown)
- Venue
- Updated
- Actions (edit/delete)

Rules:
- Table rows must be easy to scan.
- Clickable row opens details (side panel recommended).
- Keep row height ~48–56px.

### 6.2 Filters & Search
- Search input at the top
- Filters:
  - status
  - year range (optional)
  - included/excluded

Rules:
- Filters must be simple and resettable (one “Clear filters” action).

### 6.3 Forms
- Use library Form, Input, Textarea, Select
- Validation:
  - Title required
  - Year must be numeric
  - DOI/URL optional but at least one recommended

Rule:
- Do not show complex validation unless needed.

### 6.4 Dialogs / Side Panels
- Use dialogs for quick add.
- Use side panel for editing details (recommended).

Rules:
- Dialogs must trap focus and close with `Esc`.
- Side panel must preserve table scroll position.

### 6.5 Buttons
Only these variants:
- Primary
- Secondary
- Ghost
- Destructive

Rules:
- Primary button is used for the main action only.
- Destructive actions require confirmation.

---

## 7) States (Mandatory on every screen)

Every page must implement:
- **Loading** (skeleton preferred for tables)
- **Empty** (explain what to do + show CTA)
- **Error** (clear message + retry)

Rules:
- Empty state must include the primary action (e.g., “Add your first paper”).

---

## 8) Responsiveness (No Surprises)

### Desktop
- Table + filters visible
- Side panel allowed

### Tablet
- Table stays usable
- Side panel may become full-screen overlay

### Mobile
- Table becomes a stacked list (cards) or simplified table
- Filters in a drawer/sheet
- “Add Paper” CTA always visible (top or floating)

Rules:
- Tap targets must be ≥ 40px.
- No tiny dropdowns that are hard to touch.

---

## 9) Accessibility Rules (Required)

- Visible `:focus-visible` states (never remove globally)
- Icon-only buttons must have `aria-label`
- Text must have adequate contrast
- `Esc` closes dialogs/side panels
- Form fields must have labels

---

## 10) Motion (Optional, Keep It Subtle)

- Transitions are allowed but minimal:
  - 150–200ms
  - ease-in-out

Rules:
- No bouncing or heavy animations.
- Motion must never block interaction.

---

## 11) UI Quality Gate (Merge Blockers)

A frontend PR must not be merged if:
- It bypasses the component library and reimplements UI controls unnecessarily
- It introduces inconsistent spacing/typography
- It lacks empty/loading/error states
- It breaks keyboard navigation or removes focus styles
- It makes common workflows slower than Excel (e.g., too many clicks)

---
