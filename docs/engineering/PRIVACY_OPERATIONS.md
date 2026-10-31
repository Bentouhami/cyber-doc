# Privacy and Data-Subject Operations

Status: engineering baseline; product/privacy approval required before production GO
Last reviewed: 2026-10-30

This document maps CyberDoc data to technical operations. It deliberately does
not invent a legal basis, statutory retention period or jurisdiction-specific
right. The accountable product/privacy owner must approve those decisions and
record them below before an automated purge or production release.

## Data inventory

| Data class | Primary stores | Examples | Sensitivity | Current lifecycle |
| --- | --- | --- | --- | --- |
| Workforce identity | `User`, `Account`, `Session`, `UserRole` | name, email, CIN, phone, address, credential hash, session metadata | high | user soft-delete and session revocation exist; final retention undecided |
| Client/persona identity | `Persona`, `DocumentParticipant`, `DocumentClient` | names, national ID, address, phone, email, notes | high | persona soft-delete exists; document-linked retention undecided |
| Document content | `Document`, `DocumentFieldValue`, generated files | contract fields, participant links, PDF/HTML output, internal notes | high | access is authenticated and owner-scoped; deletion/retention undecided |
| Financial/operational records | `Document`, `PrintHistory`, `DailyStats` | charged/paid amounts, cashier, print events | medium/high | append/update behavior exists; retention undecided |
| Security/authentication | `Account`, `Session`, `Verification`, `RateLimit` | password hash, token material, IP/user-agent session metadata | critical | secrets are excluded from API/log output; session revocation exists |
| Audit trail | `ActivityLog`, `ActivityType` | actor ID, action type, resource type/ID, timestamp | medium | admin-only minimized API/UI; retention/export undecided |
| Template/configuration | template models, `AppSetting`, template assets | document schema, safe HTML/CSS, paths | low/medium | admin-managed lifecycle |

Generated documents and template assets live on storage as well as in database
metadata. A subject operation is incomplete if it changes one layer but not the
other.

## Enforced technical safeguards

- Public signup is disabled; inactive, deleted or password-changed accounts lose
  their sessions immediately.
- API errors and structured server logs exclude raw payloads, credentials,
  document content and personal field values.
- The activity API returns only actor ID/name, action/category, resource ID/type
  and timestamp. It never returns session IP, user-agent or arbitrary payloads.
- No current activity-log writer stores `userAgent`; a read-only check on
  2026-10-30 found zero non-null activity-log user-agent rows. The nullable legacy
  schema column must not be populated and requires an approved migration before
  it can be dropped.
- Generated files use database ownership checks, realpath containment, symlink
  rejection and safe response filenames.
- Secret scanning, dependency audit and authenticated abuse cases run before push.

## Decisions required before production GO

Complete this table with an accountable owner and approval reference. Durations
shown as `TBD` are not defaults.

| Data class | Purpose/legal basis owner | Active retention | Post-deletion retention | Export format | Erasure/anonymization rule | Approval reference |
| --- | --- | --- | --- | --- | --- | --- |
| Workforce identity | TBD | TBD | TBD | TBD | TBD | pending |
| Client/persona identity | TBD | TBD | TBD | TBD | TBD | pending |
| Documents and generated files | TBD | TBD | TBD | TBD | TBD | pending |
| Financial/print records | TBD | TBD | TBD | TBD | TBD | pending |
| Sessions/security metadata | TBD | TBD | TBD | TBD | TBD | pending |
| Activity logs | TBD | TBD | TBD | TBD | TBD | pending |
| Backups | TBD | TBD | TBD | not applicable | expiry/rotation TBD | pending |

Retention starts from an explicitly defined event, not merely from `createdAt`,
unless the approved policy says so. Legal holds, accounting constraints and
linked-record integrity must be resolved before deletion logic is written.

## Subject-request runbook

1. Record the request in the approved case system; never place identity evidence
   or exported data in a Git issue, source tree or CI artifact.
2. Verify the requester through an approved out-of-band process and record the
   reviewer, scope and authorization. Engineering must not decide identity alone.
3. Resolve identifiers across `User`, `Persona`, participant/client relations,
   documents, field values, print history and activity resources. Similar names
   without CIN/national ID require manual disambiguation.
4. Generate an export only in an access-controlled temporary location. Exclude
   password hashes, session/token material, internal security metadata, other
   persons' data and server filesystem paths.
5. Have a second authorized reviewer validate completeness and redaction before
   delivery through the approved secure channel.
6. For correction/erasure, create a dry-run impact report first. It lists affected
   entities and files by internal ID/count, not by copying content into logs.
7. Take and verify the required backup, apply the approved transaction and file
   operation, then run authorization and referential-integrity smoke checks.
8. Record counts, timestamps, approvers and outcome. Do not record exported
   personal content itself in activity logs or release evidence.
9. Expire temporary exports according to the approved policy and verify removal.

## Automation safety contract

Any future export or purge command must:

- default to dry-run and require an explicit case/reference identifier;
- require a bounded selector and refuse an empty or broad selector;
- report only entity/file counts and opaque IDs;
- use a database transaction where possible and a recoverable two-phase file
  process where database and storage cannot be atomic;
- preserve records subject to an approved hold;
- be idempotent and covered by isolated integration fixtures;
- require a second-person review for live execution;
- fail closed when policy configuration is missing;
- never run automatically from application startup or a schema migration.

## Verification evidence required for PRIV-001 closure

- approved completed decision table;
- fixture-based export completeness/redaction test;
- dry-run and live purge test against disposable data and storage;
- backup/restore proof including generated files;
- authorization test proving non-admin and cross-subject denial;
- evidence that logs, reports and CI artifacts contain no exported personal data;
- named product/privacy, engineering and operations sign-off.
