# SLR Helper - Project Context

## 1. Project Overview
**SLR Helper** is a lightweight, self-hostable web application designed to manage Systematic Literature Reviews (SLR). It aims to replace spreadsheet-based workflows with a structured, protocol-driven approach.

*   **Goal:** Simplify the workflow of collecting papers, extracting key fields, and exporting results.
*   **Core Philosophy:** "Faster than Excel", minimal UI, consistent extraction protocols.

## 2. Tech Stack

*   **Framework:** Next.js 16.0.10 (App Router)
*   **Library:** React 19.2.1
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4, `clsx`, `tailwind-merge`
*   **Icons:** Lucide React
*   **Database:** SQLite (local `dev.db`)
*   **ORM:** Prisma Client (`@prisma/client`)

## 3. Architecture & Data Model

### Data Model (`prisma/schema.prisma`)
The application revolves around a central **Project**, which contains:
*   **Protocol:** Defines the review rules (PICO, Search Strategy, Quality Assessment Plan).
*   **Studies:** The individual papers being reviewed.
    *   Key fields: Metadata (Title, Year, DOI), Workflow Status (`TO_READ`, `READING`, `EXTRACTED`, `INCLUDED`, `EXCLUDED`), and Content Extraction (Problem, Solution, Results, etc.).
*   **Quality Criteria:** Customizable criteria for scoring papers.
*   **Tags:** Flexible tagging system for studies.

### Directory Structure
*   `src/app`: Next.js App Router pages and layouts.
*   `src/components`: React components (UI, Layouts).
*   `src/lib`: Utility functions and Prisma client instance.
*   `src/actions`: Server Actions for data mutations.
*   `prisma`: Database schema and migrations.
*   `.agent/rules`: Project-specific coding and design rules.

## 4. Development Workflow

### Key Commands
*   **Start Development Server:** `npm run dev` (Runs on http://localhost:3000)
*   **Database Migration:** `npx prisma migrate dev` (Applies schema changes)
*   **Generate Prisma Client:** `npx prisma generate` (Updates type definitions)
*   **Build Production:** `npm run build`
*   **Start Production:** `npm run start`
*   **Linting:** `npm run lint`

### Setup Instructions
1.  Copy `.env.example` to `.env`.
2.  Ensure `DATABASE_URL="file:./dev.db"` is set.
3.  Run migrations: `npx prisma migrate dev`.
4.  Start server: `npm run dev`.

## 5. Coding Standards & Rules

### Core Mandates
*   **Clean Code:** Follow DRY, KISS, and SOLID principles.
*   **Type Safety:** Strict TypeScript usage. No `any` unless absolutely unavoidable.
*   **Testing:** Write deterministic and independent tests.

### Frontend Guidelines (Strict)
*   **UI Library:** Use existing components (e.g., shadcn/ui patterns) + Tailwind. Avoid custom styling where possible.
*   **Performance:** "Faster than Excel". Quick add (< 30s), inline editing, and keyboard support are mandatory.
*   **Design:** Neutral/Grayscale aesthetics. Focus on readability and hierarchy.
*   **State:** Use Server Components by default. Keep Client Components leaf-level.
*   **Contrast (Strict):** Ensure high contrast for text. Text on light backgrounds MUST be dark (e.g., use `text-slate-700` or `text-slate-900`, NOT `text-slate-400` or `text-slate-500`). Explicitly type text colors.

### Next.js & React 19 Patterns
*   **Server Actions:** Use for all data mutations.
*   **Fetching:** Fetch data in Server Components or Route Handlers.
*   **Hydration:** Ensure server/client render consistency. Avoid browser-only APIs during render.
*   **Images/Fonts:** Use `next/image` and `next/font`.

### Database
*   **Schema:** modifying `schema.prisma` requires running a migration immediately.
*   **Validation:** Trust no input. Validate all data on the server side before persisting.

## 6. Documentation
*   Refer to `.agent/rules/` for detailed breakdown of:
    *   Clean Code Principles
    *   Design Rules (UI/UX)
    *   Next.js 16 & React 19 Specifics
    *   Security Risks (OWASP)
