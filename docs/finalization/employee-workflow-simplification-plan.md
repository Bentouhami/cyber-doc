# Employee Workflow Simplification Plan (Client Intake -> Document Ready)

Date: 2026-03-20  
Branch baseline: `dev`  
Goal: reduce employee effort and time-to-document while improving data quality.

## Outcome Target

- Average document creation time: less than 90 seconds for common templates.
- Persona reuse rate: greater than 70% on repeat clients.
- Duplicate persona creation: reduced by at least 60%.
- Employee flow: intake-first, fewer manual fields, faster finalization.

## Scope

- In scope: `/documents/create` flow, persona search/reuse, draft behavior, payment step UX, related APIs.
- Out of scope: admin template authoring redesign, billing/accounting module redesign, printer infra redesign.

## Constraints and Dependencies

- Blockers RC-001 and RC-002 (auth/session and route protection) must be fixed before rollout.
- Keep Next.js fullstack architecture boundaries (UI -> route handlers -> services -> Prisma).
- Keep `lint`, `type-check`, and `build` green on each PR.

## Phase A - Foundation Stabilization (Must Pass First)

### A1. Resolve auth/session blockers for employee flow
- Priority: Critical
- Files likely touched:
  - `app/page.tsx`
  - `app/layout.tsx`
  - `components/auth/login.tsx`
  - `lib/auth-client.ts`
  - `components/auth/route-guard.tsx`
- Acceptance:
  - Employee login redirects to `/documents`.
  - Protected routes do not render without valid session.
  - `GET /api/documents` and `GET /api/personas` return 200 for authenticated employee.

### A2. Add auth regression smoke
- Priority: Critical
- Files likely touched:
  - `scripts/rc-smoke.mjs`
  - `docs/finalization/rc-smoke-report.md`
- Acceptance:
  - Script asserts login success + protected route behavior.

## Phase B - Intake Speed (No DB Migration First)

### B1. Replace manual lookup button with live persona autocomplete
- Priority: High
- Files likely touched:
  - `components/templates/template-form.tsx`
  - `app/api/personas/route.ts`
- Behavior:
  - Employee types CIN/phone/name.
  - Top matches appear instantly.
  - Selecting a persona fills participant and mapped template fields.
- Acceptance:
  - No extra “lookup click” required for standard path.
  - Time to fill participant section reduced significantly.

### B2. Add “Start from previous similar document”
- Priority: High
- Files likely touched:
  - `components/templates/template-workbench.tsx`
  - `components/documents/documents-dashboard.tsx`
  - `app/api/documents/[documentId]/duplicate/route.ts`
- Behavior:
  - Duplicate last document of same template and open `/documents/create?documentId=...`.
- Acceptance:
  - One action from list/dashboard opens prefilled editable draft.

### B3. Reorder flow into strict 3-step employee journey
- Priority: High
- Steps:
  - Step 1: Client Intake (persona select/create)
  - Step 2: Template Fields (only relevant sections)
  - Step 3: Payment & Finalize (copies, amount paid, change)
- Files likely touched:
  - `components/templates/template-workbench.tsx`
  - `components/templates/template-form.tsx`
- Acceptance:
  - Payment controls removed from early steps.
  - Clear progress indicator and keyboard-friendly next action.

### B4. Autosave draft updates
- Priority: Medium
- Files likely touched:
  - `components/templates/template-form.tsx`
  - `app/api/documents/[documentId]/route.ts`
- Behavior:
  - After first create, background autosave via PATCH every few seconds (with debounce).
- Acceptance:
  - Refresh/browser crash does not lose entered data for active draft.

## Phase C - Data Quality and Reuse (DB + API)

### C1. Add normalized persona search fields
- Priority: High
- Proposed schema additions:
  - `Persona.nationalIdNormalized`
  - `Persona.phoneNormalized`
  - `Persona.fullNameNormalized`
- Files likely touched:
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
  - `app/api/personas/route.ts`
  - `app/api/documents/generate/route.ts`
  - `app/api/documents/[documentId]/route.ts`
- Acceptance:
  - Search prioritizes exact normalized match, then fuzzy search.
  - Duplicate creation drops for equivalent CIN/phone formats.

### C2. Resolve identity model ambiguity (`Persona` vs `DocumentClient`)
- Priority: High
- Decision options:
  - Option 1: Wire `DocumentClient` during generation for explicit client link.
  - Option 2: Deprecate `DocumentClient` if `Persona` is canonical.
- Files likely touched:
  - `prisma/schema.prisma`
  - `app/api/documents/generate/route.ts`
  - `app/api/documents/[documentId]/route.ts`
  - Documentation under `docs/finalization`.
- Acceptance:
  - One clear source of truth for client identity in document lifecycle.

## Phase D - Employee “Speed Mode”

### D1. Quick templates and pinned favorites
- Priority: Medium
- Files likely touched:
  - `components/templates/template-picker.tsx`
  - `app/api/templates/route.ts` (optional query filters)
  - `app/api/app-settings` (if needed) or local preference storage
- Acceptance:
  - Employee reaches top templates in one click.

### D2. Compact mode for high-frequency templates
- Priority: Medium
- Files likely touched:
  - `components/templates/template-form.tsx`
  - template metadata usage in `app/documents/create/page.tsx`
- Acceptance:
  - Repeated template flows avoid long generic forms.

### D3. Keyboard-first operation pass
- Priority: Medium
- Files likely touched:
  - `components/templates/template-form.tsx`
  - input components and submit flow
- Acceptance:
  - Complete flow using keyboard only.
  - Proper focus order and visible focus state.

## Phase E - Metrics and Optimization Loop

### E1. Add workflow telemetry (lightweight first)
- Priority: Medium
- Events:
  - `intake_started`, `persona_selected`, `document_generated`, `draft_autosaved`
- Metrics:
  - creation duration
  - persona reuse rate
  - duplicate persona rate
  - draft abandonment rate
- Files likely touched:
  - `app/api/documents/generate/route.ts`
  - `app/api/documents/[documentId]/route.ts`
  - optional service/log table integration
- Acceptance:
  - Weekly review can rank top bottlenecks with data.

## Delivery Order (Recommended PR Sequence)

1. PR-1: Auth/session blockers + smoke safeguards (Phase A).  
2. PR-2: Live persona autocomplete + auto-fill + flow reorder (B1, B3).  
3. PR-3: Duplicate/start-from-previous + autosave draft (B2, B4).  
4. PR-4: Persona normalization migration + API updates (C1).  
5. PR-5: Identity model decision (`Persona`/`DocumentClient`) (C2).  
6. PR-6: Speed mode + quick templates + keyboard pass (Phase D).  
7. PR-7: Metrics instrumentation + tuning loop (Phase E).

## Definition of Done (Track-Level)

- Employee can process common cases quickly without switching pages.
- Client lookup is fast and reliable.
- Data duplication is controlled by normalized matching.
- Drafts are resilient.
- Metrics show measurable improvement versus baseline.

