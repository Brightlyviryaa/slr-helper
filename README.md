# SLR Helper

A lightweight, self-hostable web app to manage a **Systematic Literature Review (SLR)** using a structured protocol and an extraction table—without the formatting pain of Excel/Word.

Designed for students and researchers who want a simple workflow like: **collect ~5 papers/day → extract key fields → compare studies → export to CSV**.

---

## Why this exists

Many SLR workflows end up scattered across spreadsheets and documents, making it hard to:
- keep a consistent **review protocol** (PICO, search strategy, quality assessment plan),
- maintain a clean **data extraction table**,
- track progress (to-read → extracted → included/excluded),
- export results reliably.

This tool solves that with a minimal CRUD-based dashboard.

---

## Key Features

### Project-centric SLR
- Create a **Project**
- Each Project includes:
 1) a single **SLR Protocol** (your “ground truth”)
 2) many **Studies/Papers** (your extraction table)

### SLR Protocol (per project)
Store the review foundation in one place:
- Review protocol
- Background
- Objective
- Review questions:
  - Full review question
  - **PICO**: Population, Intervention, Comparison, Outcome
- Search strategy
- Databases
- Search terms / boolean queries
- Identifying other useful sources
- Additional limits
- Study quality assessment plan
- Data extraction & synthesis plan

### Study/Paper Extraction Table
Maintain one row per study with common SLR extraction fields:
- Metadata: title, authors, year, venue, DOI, URL, keywords
- Research type & domain
- Problem statement, proposed solution, key techniques
- Data/input used and outputs
- Evaluation method + metrics/results
- Strengths, limitations, gap notes
- What you will adopt for your thesis
- Status workflow: `TO_READ → READING → EXTRACTED → INCLUDED/EXCLUDED`

### Quality Assessment (optional but recommended)
- Define per-project quality criteria (Q1, Q2, …)
- Score each study against criteria

### Export
- Export a project’s studies to **CSV** (Excel-friendly)

---

## Tech Stack

- **Next.js** (App Router)
- **SQLite** (local, easy to run)
- **Prisma** (schema + migrations)
- **TypeScript**
- UI: minimal modern layout (navbar + collapsible sidebar)

---

## Data Model (High-Level)

- `Project` (1)
  - `Protocol` (1)
  - `Studies` (many)
  - `QualityCriteria` (many, optional)

---

## Getting Started

### 1) Clone
```bash
git clone <your-repo-url>
cd slr-tracker
````

### 2) Install dependencies

```bash
npm install
```

### 3) Configure environment

Create `.env`:

```bash
cp .env.example .env
```

Example (SQLite):

```env
DATABASE_URL="file:./dev.db"
```

### 4) Setup database

```bash
npx prisma migrate dev
npx prisma generate
```

### 5) Run dev server

```bash
npm run dev
```

Open:

* [http://localhost:3000](http://localhost:3000)

---

## Usage

1. **Create a Project**
2. Fill the **SLR Protocol** (review question + PICO + strategy)
3. Add papers into the **Studies** table:

   * Start minimal (title, year, DOI/URL)
   * Later fill extraction fields
4. Mark each paper status:

   * `TO_READ`, `READING`, `EXTRACTED`, `INCLUDED`, `EXCLUDED`
5. Export to CSV when you need to submit results.

---

## Recommended Workflow (5 papers/day)

* During discovery:

  * Add paper with minimal metadata → status `TO_READ`
* During reading:

  * Fill extraction fields → status `EXTRACTED`
* During selection:

  * Mark `INCLUDED` or `EXCLUDED` (+ exclusion reason)

This avoids perfectionism and keeps daily progress consistent.

---

## CSV Export Columns

The export is designed to match typical SLR extraction tables, including:

* paper metadata (title/authors/year/venue/doi/url)
* problem/solution/techniques/evaluation/results
* strengths/limitations/gap/adoption
* status/exclusion reason

---

## Roadmap (Optional)

* BibTeX export
* Import from CSV
* DOI lookup (Crossref)
* Full-text notes
* Attachments (PDF links)
* Simple charts (included vs excluded, year distribution)

---

## Contributing

PRs are welcome. Please keep the scope minimal and the UI clean.

---

## License

MIT License. See `LICENSE`.

---

## Acknowledgements

This project is inspired by standard SLR protocol structures (PICO, search strategy, quality assessment, and extraction/synthesis planning).

```
::contentReference[oaicite:0]{index=0}